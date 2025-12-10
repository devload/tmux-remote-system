import { useState, useCallback, useRef, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { Terminal, getTerminalWriter } from './components/Terminal';
import { CommandBar } from './components/CommandBar';
import { useWebSocket } from './hooks/useWebSocket';
import { SessionInfo } from './types';
import './App.css';

const WS_URL = `ws://${window.location.hostname}:8080/ws`;

function App() {
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
    onScreen: handleScreen,
    onSessionList: handleSessionList,
    onSessionStatus: handleSessionStatus,
  });

  const handleSelectSession = (sessionId: string) => {
    currentSessionRef.current = sessionId;
    setCurrentSession(sessionId);
    joinSession(sessionId);
  };

  const handleSendCommand = (command: string) => {
    if (currentSession) {
      sendKeys(currentSession, command);
    }
  };

  const currentSessionInfo = sessions.find(s => s.id === currentSession);

  return (
    <div className="app">
      <SessionList
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={handleSelectSession}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <div className="main-content">
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
      </div>
    </div>
  );
}

export default App;
