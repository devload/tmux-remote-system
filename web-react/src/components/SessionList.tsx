import { SessionInfo } from '../types';
import { useLanguage } from '../i18n';
import './SessionList.css';

interface SessionListProps {
  sessions: SessionInfo[];
  currentSession: string | null;
  onSelectSession: (sessionId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout?: () => void;
  onManageTokens?: () => void;
  isOpen?: boolean;
}

export function SessionList({ sessions, currentSession, onSelectSession, theme, onToggleTheme, onLogout, onManageTokens, isOpen }: SessionListProps) {
  const { t, lang, setLang } = useLanguage();

  const groupedSessions = sessions.reduce((acc, session) => {
    const machine = session.machineId || 'Unknown';
    if (!acc[machine]) {
      acc[machine] = [];
    }
    acc[machine].push(session);
    return acc;
  }, {} as Record<string, SessionInfo[]>);

  const toggleLanguage = () => {
    setLang(lang === 'ko' ? 'en' : 'ko');
  };

  return (
    <div className={`session-list ${isOpen ? 'open' : ''}`}>
      <div className="session-list-header">
        <h2>{t('sessions')}</h2>
        <div className="header-actions">
          <button className="lang-toggle-btn" onClick={toggleLanguage} title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}>
            {lang === 'ko' ? 'EN' : 'KO'}
          </button>
          <button className="theme-toggle" onClick={onToggleTheme} title={theme === 'dark' ? (lang === 'ko' ? '라이트 모드' : 'Light mode') : (lang === 'ko' ? '다크 모드' : 'Dark mode')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {onManageTokens && (
            <button className="token-btn" onClick={onManageTokens} title={lang === 'ko' ? 'Agent 토큰' : 'Agent Tokens'}>
              🔑
            </button>
          )}
          {onLogout && (
            <button className="logout-btn" onClick={onLogout} title={lang === 'ko' ? '로그아웃' : 'Logout'}>
              ↪
            </button>
          )}
        </div>
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
          <div className="no-sessions">{t('noSessions')}</div>
        )}
      </div>
    </div>
  );
}
