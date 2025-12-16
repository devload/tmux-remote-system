import { useState, useCallback, useRef, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { Terminal, getTerminalWriter } from './components/Terminal';
import { CommandBar } from './components/CommandBar';
import { Login } from './components/Login';
import { ConsentScreen } from './components/ConsentScreen';
import { TokenManager } from './components/TokenManager';
import { ApiKeyManager } from './components/ApiKeyManager';
import { AgentApiSettings } from './components/AgentApiSettings';
import { OnboardingGuide } from './components/OnboardingGuide';
import { UpgradeDialog } from './components/UpgradeDialog';
import { AdModal } from './components/AdModal';
import { useWebSocket } from './hooks/useWebSocket';
import { PlanLimitError, SessionInfo } from './types';
import './App.css';

const PLATFORM_API_URL = import.meta.env.VITE_PLATFORM_API_URL || import.meta.env.VITE_API_URL || '';
const DEFAULT_WS_BASE = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
const DEFAULT_WS_URL = `${DEFAULT_WS_BASE}/ws`;

function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    // Check URL for token (OAuth2 redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      // Keep the current pathname but remove query params
      window.history.replaceState({}, document.title, window.location.pathname);
      return urlToken;
    }
    return localStorage.getItem('auth_token');
  });
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const currentSessionRef = useRef<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [, setKeyInputCount] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  // Show ad every 10 command submissions for free users
  const AD_TRIGGER_COUNT = 10;
  const isFreePlan = userPlan === 'free';

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch user info to get relay URL
  useEffect(() => {
    if (!authToken) {
      setWsUrl(null);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${PLATFORM_API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          // Set user name and onboarding status
          setUserName(userData.name || userData.email);
          setOnboardingCompleted(userData.onboardingCompleted ?? false);
          // Set user plan for ad display logic
          if (userData.plan) {
            setUserPlan(userData.plan.toLowerCase());
          }
          if (userData.relayUrl) {
            console.log('Using personal relay URL:', userData.relayUrl);
            setWsUrl(userData.relayUrl);
          } else {
            console.log('No personal relay URL, using default:', DEFAULT_WS_URL);
            setWsUrl(DEFAULT_WS_URL);
          }
        } else {
          console.warn('Failed to fetch user info, using default relay');
          setOnboardingCompleted(true); // Assume completed if can't fetch
          setWsUrl(DEFAULT_WS_URL);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setOnboardingCompleted(true); // Assume completed if error
        setWsUrl(DEFAULT_WS_URL);
      }
    };

    fetchUserInfo();
  }, [authToken]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLoginSuccess = useCallback((token: string) => {
    setAuthToken(token);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setOnboardingCompleted(null);
    setUserName(undefined);
  }, []);

  const [showTokenManager, setShowTokenManager] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const [showAgentApiSettings, setShowAgentApiSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatedSessions, setUpdatedSessions] = useState<Set<string>>(new Set());
  const [planLimitError, setPlanLimitError] = useState<PlanLimitError | null>(null);
  const [lang] = useState<'ko' | 'en'>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'ko' || saved === 'en') ? saved : 'ko';
  });
  const [hiddenSessions, setHiddenSessions] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('hidden_sessions');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const handleScreen = useCallback((sessionId: string, data: string) => {
    // Use ref to always get current session value
    if (sessionId === currentSessionRef.current) {
      const writer = getTerminalWriter();
      if (writer) {
        writer(data);
      }
    } else {
      // Mark session as having new updates (only if not currently viewing)
      setUpdatedSessions(prev => {
        const next = new Set(prev);
        next.add(sessionId);
        return next;
      });
    }
  }, []);

  const handleSessionList = useCallback((newSessions: SessionInfo[]) => {
    setSessions(newSessions);
  }, []);

  const handleSessionStatus = useCallback((sessionId: string, status: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: status as 'online' | 'offline' } : s
    ));
  }, []);

  const handlePlanLimitError = useCallback((error: PlanLimitError) => {
    setPlanLimitError(error);
  }, []);

  const { status, joinSession, sendKeys, createSession, sendResize, killSession } = useWebSocket({
    url: wsUrl || '',
    token: authToken,
    onScreen: handleScreen,
    onSessionList: handleSessionList,
    onSessionStatus: handleSessionStatus,
    onPlanLimitError: handlePlanLimitError,
  });

  const handleCreateSession = useCallback((machineId: string, sessionName: string) => {
    createSession(machineId, sessionName);
  }, [createSession]);

  const handleKillSession = useCallback((sessionId: string) => {
    killSession(sessionId);
  }, [killSession]);

  const handleHideSession = useCallback((sessionId: string) => {
    setHiddenSessions(prev => {
      const next = new Set(prev);
      next.add(sessionId);
      localStorage.setItem('hidden_sessions', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Filter out hidden sessions
  const visibleSessions = sessions.filter(s => !hiddenSessions.has(s.id));

  const handleSelectSession = (sessionId: string) => {
    currentSessionRef.current = sessionId;
    setCurrentSession(sessionId);
    joinSession(sessionId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
    // Clear update indicator when selecting session
    setUpdatedSessions(prev => {
      const next = new Set(prev);
      next.delete(sessionId);
      return next;
    });
  };

  // Count command submissions and show ads for free users
  const handleSendCommand = (command: string) => {
    if (currentSession) {
      sendKeys(currentSession, command);

      // Count command submissions for free users
      if (isFreePlan) {
        setKeyInputCount(prev => {
          const newCount = prev + 1;
          if (newCount >= AD_TRIGGER_COUNT) {
            setShowAdModal(true);
            return 0; // Reset counter
          }
          return newCount;
        });
      }
    }
  };

  // Direct key input (no ad counting)
  const handleSendKeys = useCallback((sessionId: string, data: string) => {
    sendKeys(sessionId, data);
  }, [sendKeys]);

  const currentSessionInfo = sessions.find(s => s.id === currentSession);

  // Show login page if not authenticated
  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Show consent screen if onboarding not completed
  if (onboardingCompleted === false) {
    return (
      <ConsentScreen
        authToken={authToken}
        userName={userName}
        onComplete={() => setOnboardingCompleted(true)}
        onLogout={handleLogout}
      />
    );
  }

  // Show loading while checking onboarding status
  if (onboardingCompleted === null) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Mobile sidebar toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <SessionList
        sessions={visibleSessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onManageTokens={() => setShowTokenManager(true)}
        isOpen={sidebarOpen}
        onCreateSession={handleCreateSession}
        onKillSession={handleKillSession}
        onHideSession={handleHideSession}
        updatedSessions={updatedSessions}
        showAd={isFreePlan}
        onUpgrade={() => window.open('/pricing', '_blank')}
        authToken={authToken || undefined}
        userName={userName}
      />
      {showTokenManager && authToken && (
        <TokenManager
          authToken={authToken}
          onClose={() => setShowTokenManager(false)}
        />
      )}
      {showApiKeyManager && authToken && (
        <ApiKeyManager
          authToken={authToken}
          onClose={() => setShowApiKeyManager(false)}
          onOpenAgentSettings={() => setShowAgentApiSettings(true)}
        />
      )}
      {showAgentApiSettings && authToken && (
        <AgentApiSettings
          authToken={authToken}
          onClose={() => setShowAgentApiSettings(false)}
        />
      )}
      {planLimitError && (
        <UpgradeDialog
          error={planLimitError}
          lang={lang}
          onClose={() => setPlanLimitError(null)}
        />
      )}
      {/* Ad modal for free users - shows every 10 key inputs */}
      <AdModal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        onUpgrade={() => window.open('/pricing', '_blank')}
      />
      <div className="main-content">
        {visibleSessions.length === 0 ? (
          <OnboardingGuide authToken={authToken} />
        ) : (
          <>
            <Terminal
              sessionId={currentSession}
              sessionLabel={currentSessionInfo?.label || null}
              status={currentSessionInfo?.status || 'offline'}
              connectionStatus={status}
              onInput={(data) => currentSession && handleSendKeys(currentSession, data)}
              onResize={(cols, rows) => currentSession && sendResize(currentSession, cols, rows)}
              theme={theme}
            />
            <CommandBar
              onSend={handleSendCommand}
              disabled={!currentSession || currentSessionInfo?.status !== 'online'}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
