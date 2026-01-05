import { useState, useEffect } from 'react';
import { SessionInfo } from '../types';
import { useLanguage } from '../i18n';
import { AdBanner } from './AdBanner';
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
  onCreateSession?: (machineId: string, sessionName: string) => void;
  onKillSession?: (sessionId: string) => void;
  onHideSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newLabel: string) => void;
  updatedSessions?: Set<string>;
  showAd?: boolean;
  onUpgrade?: () => void;
  authToken?: string;
  userName?: string;
}

const ACCOUNT_URL = import.meta.env.VITE_ACCOUNT_URL || 'https://account.sessioncast.io';

export function SessionList({ sessions, currentSession, onSelectSession, theme, onToggleTheme, onLogout, onManageTokens, isOpen, onCreateSession, onKillSession, onHideSession, onRenameSession, updatedSessions, showAd, onUpgrade, authToken, userName }: SessionListProps) {
  const { t, lang, setLang } = useLanguage();
  const [creatingForMachine, setCreatingForMachine] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuOpenFor && !target.closest('.session-menu-container')) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenFor]);

  const handleAccountSettings = () => {
    if (authToken) {
      window.open(`${ACCOUNT_URL}?token=${authToken}`, '_blank');
    }
  };

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

  const handleCreateSession = (machineId: string) => {
    if (!newSessionName.trim()) return;
    onCreateSession?.(machineId, newSessionName.trim());
    setNewSessionName('');
    setCreatingForMachine(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, machineId: string) => {
    if (e.key === 'Enter') {
      handleCreateSession(machineId);
    } else if (e.key === 'Escape') {
      setCreatingForMachine(null);
      setNewSessionName('');
    }
  };

  const handleMenuClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setMenuOpenFor(menuOpenFor === sessionId ? null : sessionId);
  };

  const handleKillSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (window.confirm(lang === 'ko' ? '이 세션을 종료하시겠습니까?' : 'Kill this session?')) {
      onKillSession?.(sessionId);
    }
    setMenuOpenFor(null);
  };

  const handleHideSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onHideSession?.(sessionId);
    setMenuOpenFor(null);
  };

  const handleStartRename = (e: React.MouseEvent, session: SessionInfo) => {
    e.stopPropagation();
    setRenamingSession(session.id);
    setRenameValue(session.label || session.id);
    setMenuOpenFor(null);
  };

  const handleRename = (sessionId: string) => {
    if (renameValue.trim() && onRenameSession) {
      onRenameSession(sessionId, renameValue.trim());
    }
    setRenamingSession(null);
    setRenameValue('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      handleRename(sessionId);
    } else if (e.key === 'Escape') {
      setRenamingSession(null);
      setRenameValue('');
    }
  };

  return (
    <div className={`session-list ${isOpen ? 'open' : ''}`}>
      <div className="session-list-header">
        <div className="user-info">
          <span className="user-name" title={userName}>{userName || 'SessionCast'}</span>
        </div>
        <div className="header-actions">
          <button className="lang-toggle-btn" onClick={toggleLanguage} title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}>
            {lang === 'ko' ? '한국어' : 'EN'}
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
            <div className="group-header">
              <span>{machineId}</span>
              {onCreateSession && machineSessions.some(s => s.status === 'online') && (
                <button
                  className="add-session-btn"
                  onClick={() => setCreatingForMachine(creatingForMachine === machineId ? null : machineId)}
                  title={lang === 'ko' ? '새 세션' : 'New session'}
                >
                  +
                </button>
              )}
            </div>
            {creatingForMachine === machineId && (
              <div className="create-session-input">
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, machineId)}
                  placeholder={lang === 'ko' ? '세션 이름' : 'Session name'}
                  autoFocus
                />
                <button onClick={() => handleCreateSession(machineId)} disabled={!newSessionName.trim()}>
                  {lang === 'ko' ? '생성' : 'Create'}
                </button>
              </div>
            )}
            {machineSessions.map((session) => {
              const hasUpdate = updatedSessions?.has(session.id) && currentSession !== session.id;
              const isMenuOpen = menuOpenFor === session.id;
              const isRenaming = renamingSession === session.id;
              return (
                <div
                  key={session.id}
                  className={`session-item ${currentSession === session.id ? 'active' : ''} ${hasUpdate ? 'has-update' : ''}`}
                  onClick={() => !isRenaming && onSelectSession(session.id)}
                >
                  <span className={`status-dot ${session.status}`} />
                  {isRenaming ? (
                    <input
                      type="text"
                      className="session-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                      onBlur={() => handleRename(session.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="session-label">{session.label || session.id}</span>
                  )}
                  {hasUpdate && <span className="update-indicator" />}
                  {(onKillSession || onHideSession || onRenameSession) && !isRenaming && (
                    <div className="session-menu-container">
                      <button
                        className="session-menu-btn"
                        onClick={(e) => handleMenuClick(e, session.id)}
                        title={lang === 'ko' ? '메뉴' : 'Menu'}
                      >
                        ⋮
                      </button>
                      {isMenuOpen && (
                        <div className="session-menu">
                          {onRenameSession && (
                            <button onClick={(e) => handleStartRename(e, session)}>
                              {lang === 'ko' ? '이름 변경' : 'Rename'}
                            </button>
                          )}
                          {onHideSession && (
                            <button onClick={(e) => handleHideSession(e, session.id)}>
                              {lang === 'ko' ? '숨기기' : 'Hide'}
                            </button>
                          )}
                          {onKillSession && session.status === 'online' && (
                            <button className="danger" onClick={(e) => handleKillSession(e, session.id)}>
                              {lang === 'ko' ? '종료' : 'Kill'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="no-sessions">{t('noSessions')}</div>
        )}
      </div>
      {/* Bottom Section: Account Settings and Ad Banner */}
      <div className="sidebar-bottom-section">
        {authToken && (
          <div className="account-settings-section">
            <button className="account-settings-btn" onClick={handleAccountSettings}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
              <span>{lang === 'ko' ? '계정 설정' : 'Account Settings'}</span>
            </button>
          </div>
        )}
        {showAd && <AdBanner position="sidebar" onUpgrade={onUpgrade} />}
      </div>
    </div>
  );
}
