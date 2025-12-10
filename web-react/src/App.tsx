import { useState, useCallback, useRef, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { Terminal, getTerminalWriter } from './components/Terminal';
import { CommandBar } from './components/CommandBar';
import { Login } from './components/Login';
import { TokenManager } from './components/TokenManager';
import { OnboardingGuide } from './components/OnboardingGuide';
import { useWebSocket } from './hooks/useWebSocket';
import { SessionInfo } from './types';
import './App.css';

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws`;

function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    // Check URL for token (OAuth2 redirect)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('auth_token', urlToken);
      window.history.replaceState({}, document.title, '/');
      return urlToken;
    }
    return localStorage.getItem('auth_token');
  });
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const currentSessionRef = useRef<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLoginSuccess = useCallback((token: string) => {
    setAuthToken(token);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
  }, []);

  const [showTokenManager, setShowTokenManager] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleScreen = useCallback((sessionId: string, data: string) => {
    // Use ref to always get current session value
    if (sessionId === currentSessionRef.current) {
      const writer = getTerminalWriter();
      if (writer) {
        writer(data);
      }
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

  const { status, joinSession, sendKeys } = useWebSocket({
    url: WS_URL,
    token: authToken,
    onScreen: handleScreen,
    onSessionList: handleSessionList,
    onSessionStatus: handleSessionStatus,
  });

  const handleSelectSession = (sessionId: string) => {
    currentSessionRef.current = sessionId;
    setCurrentSession(sessionId);
    joinSession(sessionId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleSendCommand = (command: string) => {
    if (currentSession) {
      sendKeys(currentSession, command);
    }
  };

  const currentSessionInfo = sessions.find(s => s.id === currentSession);

  // Show login page if not authenticated
  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
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
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onManageTokens={() => setShowTokenManager(true)}
        isOpen={sidebarOpen}
      />
      {showTokenManager && authToken && (
        <TokenManager
          authToken={authToken}
          onClose={() => setShowTokenManager(false)}
        />
      )}
      <div className="main-content">
        {sessions.length === 0 ? (
          <OnboardingGuide authToken={authToken} />
        ) : (
          <>
            <Terminal
              sessionId={currentSession}
              sessionLabel={currentSessionInfo?.label || null}
              status={currentSessionInfo?.status || 'offline'}
              connectionStatus={status}
              onInput={(data) => currentSession && sendKeys(currentSession, data)}
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
