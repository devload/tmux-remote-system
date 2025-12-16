import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './Terminal.css';

interface TerminalProps {
  sessionId: string | null;
  sessionLabel: string | null;
  status: 'online' | 'offline';
  connectionStatus: string;
  onInput: (data: string) => void;
  onResize?: (cols: number, rows: number) => void;
  onRefresh?: () => void;
  theme: 'dark' | 'light';
}

const darkTheme = {
  background: '#1e1e1e',
  foreground: '#d4d4d4',
  cursor: '#d4d4d4',
  cursorAccent: '#1e1e1e',
  selectionBackground: '#264f78',
};

const lightTheme = {
  background: '#ffffff',
  foreground: '#1a1a1a',
  cursor: '#1a1a1a',
  cursorAccent: '#ffffff',
  selectionBackground: '#b4d5fe',
};

export function Terminal({
  sessionId,
  sessionLabel,
  status,
  connectionStatus,
  onInput,
  onResize,
  onRefresh,
  theme
}: TerminalProps) {
  // Detect iOS Safari
  const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !('MSStream' in window) &&
    /Safari/.test(navigator.userAgent);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Cleanup on unmount or session change
  useEffect(() => {
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        fitAddonRef.current = null;
        setIsReady(false);
      }
    };
  }, [sessionId]);

  // Initialize terminal after DOM is ready
  useEffect(() => {
    if (!sessionId || !terminalRef.current || xtermRef.current) return;

    // Small delay to ensure DOM is fully rendered
    const initTimer = setTimeout(() => {
      if (!terminalRef.current) return;

      // Detect mobile for adjusted settings
      const isMobile = window.innerWidth <= 768;

      const xterm = new XTerm({
        cursorBlink: true,
        fontSize: isMobile ? 12 : 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        rows: 24,
        cols: 80,
        scrollback: 5000,
        theme: theme === 'light' ? lightTheme : darkTheme,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);

      xterm.open(terminalRef.current);

      xtermRef.current = xterm;
      fitAddonRef.current = fitAddon;

      // Fit after a delay
      setTimeout(() => {
        if (fitAddonRef.current && terminalRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            // ignore
          }
        }
        setIsReady(true);
      }, 50);

      xterm.onData((data) => {
        onInput(data);
      });

    }, 100);

    return () => clearTimeout(initTimer);
  }, [sessionId, onInput]);

  // Handle window resize with debounce to prevent duplicate content on mobile scroll
  useEffect(() => {
    if (!isReady) return;

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastCols = 0;
    let lastRows = 0;

    const handleResize = () => {
      // Clear previous timeout to debounce rapid resize events
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current && xtermRef.current) {
          try {
            fitAddonRef.current.fit();
            const cols = xtermRef.current.cols;
            const rows = xtermRef.current.rows;

            // Only send resize if dimensions actually changed
            if (onResize && cols > 0 && rows > 0 && (cols !== lastCols || rows !== lastRows)) {
              lastCols = cols;
              lastRows = rows;
              // Clear terminal before receiving new screen data to prevent duplication
              xtermRef.current.clear();
              onResize(cols, rows);
            }
          } catch (e) {
            // ignore
          }
        }
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial resize (no debounce for initial)
    if (fitAddonRef.current && xtermRef.current) {
      try {
        fitAddonRef.current.fit();
        const cols = xtermRef.current.cols;
        const rows = xtermRef.current.rows;
        if (onResize && cols > 0 && rows > 0) {
          lastCols = cols;
          lastRows = rows;
          onResize(cols, rows);
        }
      } catch (e) {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [isReady, onResize]);

  // Handle theme change
  useEffect(() => {
    if (xtermRef.current && isReady) {
      xtermRef.current.options.theme = theme === 'light' ? lightTheme : darkTheme;
    }
  }, [theme, isReady]);

  const writeToTerminal = useCallback((data: string) => {
    if (xtermRef.current && isReady) {
      try {
        // Data is already decoded (UTF-8 string) from useWebSocket
        xtermRef.current.write(data);
      } catch (e) {
        console.error('Failed to write to terminal:', e);
      }
    }
  }, [isReady]);

  useEffect(() => {
    (window as any).__writeToTerminal = writeToTerminal;
    return () => {
      delete (window as any).__writeToTerminal;
    };
  }, [writeToTerminal]);

  // Handle terminal refresh - clears screen and requests new data
  const handleRefresh = useCallback(() => {
    if (xtermRef.current && isReady) {
      // Clear the terminal buffer
      xtermRef.current.clear();
      xtermRef.current.reset();

      // Re-fit to get correct dimensions
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {
          // ignore
        }
      }

      // Request fresh screen data
      if (onRefresh) {
        onRefresh();
      } else if (onResize && xtermRef.current) {
        // Fallback: trigger resize to get fresh data
        const cols = xtermRef.current.cols;
        const rows = xtermRef.current.rows;
        if (cols > 0 && rows > 0) {
          onResize(cols, rows);
        }
      }
    }
  }, [isReady, onRefresh, onResize]);

  // iOS Safari: Handle visibility change to fix rendering issues
  useEffect(() => {
    if (!isIOSSafari || !isReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && xtermRef.current && fitAddonRef.current) {
        // Re-fit and refresh on returning to tab
        setTimeout(() => {
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit();
            } catch (e) {
              // ignore
            }
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isIOSSafari, isReady]);

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="header-left">
          <span className={`connection-status ${connectionStatus}`} />
          <span className="session-title">
            {sessionLabel || sessionId || 'Select a session'}
          </span>
        </div>
        <div className="header-right">
          {sessionId && (
            <>
              <button
                className="terminal-refresh-btn"
                onClick={handleRefresh}
                title="Refresh terminal"
                aria-label="Refresh terminal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </button>
              <span className={`session-status ${status}`}>
                {status === 'online' ? 'Connected' : 'Disconnected'}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="terminal-content">
        {sessionId ? (
          <div ref={terminalRef} className="xterm-wrapper" />
        ) : (
          <div className="terminal-placeholder">
            <p>Select a session from the sidebar to connect</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function getTerminalWriter(): ((data: string) => void) | null {
  return (window as any).__writeToTerminal || null;
}
