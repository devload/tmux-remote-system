import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionStatus, Message, PlanLimitError, ProjectInfo, SessionInfo } from '../types';
import pako from 'pako';

// Decode base64 to UTF-8 string
function decodeBase64(base64Data: string): string {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

// Decompress gzip data from base64
function decompressGzip(base64Data: string): string {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const decompressed = pako.ungzip(bytes);
  return new TextDecoder('utf-8').decode(decompressed);
}

const RECONNECT_BASE_DELAY = 10000;  // 10 seconds base delay
const MAX_RECONNECT_DELAY = 120000;  // 2 minutes max delay
const MAX_RECONNECT_ATTEMPTS = 3;    // Only 3 attempts before giving up
const CIRCUIT_BREAKER_DURATION = 120000; // 2 minutes circuit breaker
const CIRCUIT_BREAKER_KEY = 'ws_circuit_breaker_until_v2';

// Module-level singleton to prevent multiple connections across React re-renders
// v2: Force cache bust
let globalWebSocket: WebSocket | null = null;
let globalConnecting = false;

// Check if in OTE environment - disable circuit breaker for easier development
const IS_OTE = typeof window !== 'undefined' && (
  window.location.hostname === '15.164.214.74' ||
  window.location.hostname === '43.200.173.78' ||
  window.location.hostname.includes('ote.') ||
  new URLSearchParams(window.location.search).has('clear_cb')
);

// Persist circuit breaker across page refreshes
function getCircuitBreakerUntil(): number {
  // In OTE mode or with clear_cb param, always clear circuit breaker
  if (IS_OTE) {
    try {
      localStorage.removeItem(CIRCUIT_BREAKER_KEY);
    } catch { /* ignore */ }
    return 0;
  }
  try {
    const stored = localStorage.getItem(CIRCUIT_BREAKER_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

function setCircuitBreakerUntil(timestamp: number): void {
  try {
    localStorage.setItem(CIRCUIT_BREAKER_KEY, String(timestamp));
  } catch {
    // Ignore localStorage errors
  }
}

interface UploadResult {
  filename: string;
  path: string;
  success: boolean;
}

interface UploadError {
  filename: string;
  error: string;
}

interface AutoPilotStatus {
  phase: 'idle' | 'detecting' | 'scanning' | 'analyzing' | 'generating' | 'ready' | 'error';
  message?: string;
}

interface AutoPilotResult {
  success: boolean;
  projectType?: string;
  projectName?: string;
  workflow?: {
    name: string;
    mission: string;
    agents: Array<{ id: string; name: string; workDir: string; tasks: string[] }>;
  };
  summary?: string;
  speckit?: {
    planMd: string;
    tasksMd: string;
  };
  error?: string;
}

interface UseWebSocketOptions {
  url: string;
  token?: string | null;
  onScreen?: (sessionId: string, data: string) => void;
  onSessionList?: (sessions: SessionInfo[]) => void;
  onSessionStatus?: (sessionId: string, status: string) => void;
  onPlanLimitError?: (error: PlanLimitError) => void;
  onProjectList?: (projects: ProjectInfo[]) => void;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: UploadError) => void;
  onAutoPilotStatus?: (status: AutoPilotStatus) => void;
  onAutoPilotResult?: (result: AutoPilotResult) => void;
}

export function useWebSocket({
  url,
  token,
  onScreen,
  onSessionList,
  onSessionStatus,
  onPlanLimitError,
  onProjectList,
  onUploadComplete,
  onUploadError,
  onAutoPilotStatus,
  onAutoPilotResult,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isUnmountedRef = useRef(false);
  const currentSessionRef = useRef<string | null>(null);
  const circuitBreakerUntil = useRef<number>(getCircuitBreakerUntil()); // Circuit breaker timestamp (persisted)

  const connect = useCallback(() => {
    // Don't connect if unmounted
    if (isUnmountedRef.current) return;

    // Use global lock to prevent multiple connections across re-renders
    if (globalConnecting) return;

    // Don't connect if global WebSocket already exists and is connected/connecting
    if (globalWebSocket?.readyState === WebSocket.OPEN ||
        globalWebSocket?.readyState === WebSocket.CONNECTING) {
      wsRef.current = globalWebSocket; // Sync ref with global
      return;
    }

    // Don't connect if URL is not ready (wait for user info to be fetched)
    if (!url) {
      return;
    }

    // Circuit breaker: don't connect if we're in cooldown period
    if (Date.now() < circuitBreakerUntil.current) {
      const remainingSeconds = Math.ceil((circuitBreakerUntil.current - Date.now()) / 1000);
      console.log(`Circuit breaker active. Retry in ${remainingSeconds}s`);
      setStatus('disconnected');
      return;
    }

    // Set global connecting lock
    globalConnecting = true;
    setStatus('connecting');

    // Add token as query parameter for authentication
    const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    const ws = new WebSocket(wsUrl);
    globalWebSocket = ws; // Store globally

    ws.onopen = () => {
      globalConnecting = false; // Release global lock
      console.log('WebSocket connected');
      setStatus('connected');
      reconnectAttempts.current = 0;

      ws.send(JSON.stringify({ type: 'listSessions' }));
      ws.send(JSON.stringify({ type: 'listProjects' }));

      if (currentSessionRef.current) {
        ws.send(JSON.stringify({
          type: 'register',
          role: 'viewer',
          session: currentSessionRef.current,
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: Message = JSON.parse(event.data);

        switch (message.type) {
          case 'screen':
            if (message.session && message.payload) {
              try {
                const decoded = decodeBase64(message.payload);
                onScreen?.(message.session, decoded);
              } catch (e) {
                console.error('Failed to decode screen data:', e);
              }
            }
            break;
          case 'screenGz':
            // Handle gzip compressed screen data
            if (message.session && message.payload) {
              try {
                const decompressed = decompressGzip(message.payload);
                onScreen?.(message.session, decompressed);
              } catch (e) {
                console.error('Failed to decompress screen data:', e);
              }
            }
            break;
          case 'sessionList':
            if (message.sessions) {
              onSessionList?.(message.sessions);
            }
            break;
          case 'sessionStatus':
            if (message.session && message.status) {
              onSessionStatus?.(message.session, message.status);
            }
            break;
          case 'projectList':
            if (message.payload) {
              try {
                const projects = JSON.parse(message.payload) as ProjectInfo[];
                console.log('[WS] Received projectList:', projects);
                onProjectList?.(projects);
              } catch (e) {
                console.error('Failed to parse projectList:', e);
              }
            }
            break;
          case 'uploadComplete':
            if (message.meta) {
              console.log('[WS] Upload complete:', message.meta);
              onUploadComplete?.({
                filename: message.meta.filename || '',
                path: message.meta.path || '',
                success: message.meta.success === 'true',
              });
            }
            break;
          case 'uploadError':
            if (message.meta) {
              console.error('[WS] Upload error:', message.meta);
              onUploadError?.({
                filename: message.meta.filename || '',
                error: message.meta.error || 'Upload failed',
              });
            }
            break;
          case 'autopilotStatus':
            if (message.meta) {
              console.log('[WS] AutoPilot status:', message.meta);
              const phase = message.meta.phase as AutoPilotStatus['phase'] || 'idle';
              onAutoPilotStatus?.({
                phase,
                message: message.meta.message,
              });
            }
            break;
          case 'autopilotResult':
            if (message.meta) {
              console.log('[WS] AutoPilot result:', message.meta);
              const workflow = message.meta.workflow ? JSON.parse(message.meta.workflow) : undefined;
              const speckit = message.meta.speckit ? JSON.parse(message.meta.speckit) : undefined;
              const isSuccess = message.meta.success === 'true' || String(message.meta.success) === 'true';
              onAutoPilotResult?.({
                success: isSuccess,
                projectType: message.meta.projectType,
                projectName: message.meta.projectName,
                workflow,
                summary: message.meta.summary,
                speckit,
                error: message.meta.error,
              });
            }
            break;
          case 'error':
            if (message.meta?.code === 'PLAN_LIMIT_EXCEEDED') {
              console.warn('Plan limit exceeded:', message.meta);
              onPlanLimitError?.({
                code: 'PLAN_LIMIT_EXCEEDED',
                messageKo: message.meta.messageKo || '세션 제한에 도달했습니다.',
                messageEn: message.meta.messageEn || 'Session limit reached.',
                upgradeUrl: message.meta.upgradeUrl || 'https://sessioncast.io/pricing',
              });
            } else {
              console.error('Server error:', message.meta);
            }
            break;
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onclose = () => {
      globalConnecting = false; // Release global lock
      globalWebSocket = null; // Clear global reference
      console.log('WebSocket disconnected');
      setStatus('disconnected');
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [url, token, onScreen, onSessionList, onSessionStatus, onPlanLimitError, onProjectList, onUploadComplete, onUploadError, onAutoPilotStatus, onAutoPilotResult]);

  const scheduleReconnect = useCallback(() => {
    // Don't reconnect if unmounted
    if (isUnmountedRef.current) return;

    const attempts = reconnectAttempts.current++;

    // Stop reconnecting after max attempts and activate circuit breaker
    if (attempts >= MAX_RECONNECT_ATTEMPTS) {
      const breakerUntil = Date.now() + CIRCUIT_BREAKER_DURATION;
      circuitBreakerUntil.current = breakerUntil;
      setCircuitBreakerUntil(breakerUntil); // Persist across page refreshes
      reconnectAttempts.current = 0; // Reset for next cycle
      console.log(`Max attempts reached. Circuit breaker active for ${CIRCUIT_BREAKER_DURATION / 60000} minutes. Refresh page after that.`);
      setStatus('disconnected');
      return;
    }

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, attempts),
      MAX_RECONNECT_DELAY
    );
    const jitter = Math.random() * delay * 0.5; // More jitter to spread out reconnections

    console.log(`Reconnecting in ${Math.round((delay + jitter) / 1000)}s... (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = window.setTimeout(connect, delay + jitter);
  }, [connect]);

  const joinSession = useCallback((sessionId: string) => {
    currentSessionRef.current = sessionId;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'register',
        role: 'viewer',
        session: sessionId,
      }));
    }
  }, []);

  const sendKeys = useCallback((sessionId: string, keys: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'keys',
        session: sessionId,
        payload: keys,
      }));
    }
  }, []);

  const refreshSessions = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'listSessions' }));
    }
  }, []);

  const createSession = useCallback((machineId: string, sessionName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'createSession',
        meta: {
          machineId,
          sessionName,
        },
      }));
    }
  }, []);

  const sendResize = useCallback((sessionId: string, cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'resize',
        session: sessionId,
        meta: {
          cols: String(cols),
          rows: String(rows),
        },
      }));
    }
  }, []);

  const killSession = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'killSession',
        session: sessionId,
      }));
    }
  }, []);

  const renameSession = useCallback((sessionId: string, newLabel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'renameSession',
        session: sessionId,
        meta: {
          label: newLabel,
        },
      }));
    }
  }, []);

  const autopilotRequest = useCallback((sessionId: string, prompt: string, options?: { quick?: boolean; speckit?: boolean; workingDir?: string }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Sending autopilot request:', { sessionId, prompt, options });
      wsRef.current.send(JSON.stringify({
        type: 'autopilotRequest',
        session: sessionId,
        meta: {
          prompt,
          quick: options?.quick ? 'true' : 'false',
          speckit: options?.speckit ? 'true' : 'false',
          workingDir: options?.workingDir || '',
        },
      }));
    }
  }, []);

  const uploadFile = useCallback(async (sessionId: string, file: File): Promise<void> => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const CHUNK_SIZE = 200 * 1024; // 200KB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(chunk);
      });

      wsRef.current?.send(JSON.stringify({
        type: 'uploadFile',
        session: sessionId,
        meta: {
          filename: file.name,
          size: String(file.size),
          mimeType: file.type || 'application/octet-stream',
          chunkIndex: String(i),
          totalChunks: String(totalChunks),
        },
        payload: base64,
      }));

      // Small delay between chunks to prevent overwhelming
      if (i < totalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }, []);

  // Effect to manage connection lifecycle
  // Using url directly as dependency to ensure reconnection when URL changes
  useEffect(() => {
    isUnmountedRef.current = false;

    // Only connect if we have a valid URL
    if (url) {
      connect();
    }

    return () => {
      // Mark as unmounted to prevent reconnection attempts
      isUnmountedRef.current = true;

      // Cancel any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection and clear global reference
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Also clear global references to prevent stale state
      globalWebSocket = null;
      globalConnecting = false;
    };
  }, [url, token, connect]);

  return {
    status,
    joinSession,
    sendKeys,
    refreshSessions,
    createSession,
    sendResize,
    killSession,
    renameSession,
    uploadFile,
    autopilotRequest,
  };
}
