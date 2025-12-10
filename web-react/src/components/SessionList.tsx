import { SessionInfo } from '../types';
import './SessionList.css';

interface SessionListProps {
  sessions: SessionInfo[];
  currentSession: string | null;
  onSelectSession: (sessionId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export function SessionList({ sessions, currentSession, onSelectSession, theme, onToggleTheme }: SessionListProps) {
  const groupedSessions = sessions.reduce((acc, session) => {
    const machine = session.machineId || 'Unknown';
    if (!acc[machine]) {
      acc[machine] = [];
    }
    acc[machine].push(session);
    return acc;
  }, {} as Record<string, SessionInfo[]>);

  return (
    <div className="session-list">
      <div className="session-list-header">
        <h2>Sessions</h2>
        <button className="theme-toggle" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="session-groups">
        {Object.entries(groupedSessions).map(([machineId, machineSessions]) => (
          <div key={machineId} className="session-group">
            <div className="group-header">{machineId}</div>
            {machineSessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${currentSession === session.id ? 'active' : ''}`}
                onClick={() => onSelectSession(session.id)}
              >
                <span className={`status-dot ${session.status}`} />
                <span className="session-label">{session.label || session.id}</span>
              </div>
            ))}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="no-sessions">No sessions available</div>
        )}
      </div>
    </div>
  );
}
