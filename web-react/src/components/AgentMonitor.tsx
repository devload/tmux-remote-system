import { useRef, useEffect } from 'react';
import { AgentInfo } from '../types';
import { useLanguage } from '../i18n';
import './AgentMonitor.css';

interface AgentMonitorProps {
  agent: AgentInfo;
  onBack?: () => void;
}

export function AgentMonitor({ agent, onBack }: AgentMonitorProps) {
  const { lang } = useLanguage();
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [agent.output]);

  const getCompletedTasksCount = () => {
    if (agent.status === 'completed') return agent.tasks.length;
    if (!agent.currentTask) return 0;
    const currentIndex = agent.tasks.indexOf(agent.currentTask);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  const completedTasks = getCompletedTasksCount();
  const progress = agent.tasks.length > 0
    ? Math.round((completedTasks / agent.tasks.length) * 100)
    : 0;

  const getStatusLabel = () => {
    switch (agent.status) {
      case 'pending': return lang === 'ko' ? '대기 중' : 'Pending';
      case 'running': return lang === 'ko' ? '실행 중' : 'Running';
      case 'completed': return lang === 'ko' ? '완료' : 'Completed';
      case 'failed': return lang === 'ko' ? '실패' : 'Failed';
      default: return agent.status;
    }
  };

  return (
    <div className="agent-monitor">
      {/* Header */}
      <div className="monitor-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← {lang === 'ko' ? '목록' : 'Back'}
          </button>
        )}
        <div className="header-info">
          <h3 className="agent-name">{agent.name}</h3>
          <span className={`agent-status-badge status-${agent.status}`}>
            {getStatusLabel()}
          </span>
        </div>
      </div>

      {/* Current Task */}
      {agent.currentTask && (
        <div className="current-task-section">
          <div className="section-label">{lang === 'ko' ? '현재 태스크' : 'Current Task'}</div>
          <div className="current-task">{agent.currentTask}</div>
        </div>
      )}

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">{lang === 'ko' ? '진행률' : 'Progress'}</span>
          <span className="progress-value">{completedTasks} / {agent.tasks.length} ({progress}%)</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-section">
        <div className="section-label">{lang === 'ko' ? '태스크' : 'Tasks'}</div>
        <ul className="tasks-list">
          {agent.tasks.map((task, index) => {
            let taskStatus: 'completed' | 'current' | 'pending' = 'pending';
            if (agent.status === 'completed') {
              taskStatus = 'completed';
            } else if (task === agent.currentTask) {
              taskStatus = 'current';
            } else if (index < completedTasks) {
              taskStatus = 'completed';
            }

            return (
              <li key={index} className={`task-item ${taskStatus}`}>
                <span className="task-icon">
                  {taskStatus === 'completed' && '✓'}
                  {taskStatus === 'current' && '▶'}
                  {taskStatus === 'pending' && '○'}
                </span>
                <span className="task-text">{task}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Output */}
      {agent.output && (
        <div className="output-section">
          <div className="section-label">{lang === 'ko' ? '출력' : 'Output'}</div>
          <div className="output-container" ref={outputRef}>
            <pre className="output-text">{agent.output}</pre>
          </div>
        </div>
      )}

      {/* Error */}
      {agent.error && (
        <div className="error-section">
          <div className="section-label">{lang === 'ko' ? '오류' : 'Error'}</div>
          <div className="error-container">
            <pre className="error-text">{agent.error}</pre>
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="meta-section">
        {agent.workDir && (
          <div className="meta-item">
            <span className="meta-label">{lang === 'ko' ? '작업 디렉토리' : 'Work Dir'}</span>
            <span className="meta-value">{agent.workDir}</span>
          </div>
        )}
        {agent.startedAt && (
          <div className="meta-item">
            <span className="meta-label">{lang === 'ko' ? '시작' : 'Started'}</span>
            <span className="meta-value">{new Date(agent.startedAt).toLocaleString()}</span>
          </div>
        )}
        {agent.completedAt && (
          <div className="meta-item">
            <span className="meta-label">{lang === 'ko' ? '완료' : 'Completed'}</span>
            <span className="meta-value">{new Date(agent.completedAt).toLocaleString()}</span>
          </div>
        )}
        {agent.retryCount !== undefined && agent.retryCount > 0 && (
          <div className="meta-item">
            <span className="meta-label">{lang === 'ko' ? '재시도' : 'Retries'}</span>
            <span className="meta-value">{agent.retryCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
