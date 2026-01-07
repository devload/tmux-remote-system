import { useState, useCallback } from 'react';
import { ProjectInfo, AgentInfo, ProjectStatus } from '../types';
import { useLanguage } from '../i18n';
import { WorkflowGraph } from './WorkflowGraph';
import { AgentMonitor } from './AgentMonitor';
import './ProjectDetail.css';

interface ProjectDetailProps {
  project: ProjectInfo;
  onBack: () => void;
  onStartWorkflow: (projectId: string) => void;
  onStopWorkflow: (projectId: string) => void;
  onSubscribeAgentOutput?: (projectId: string, agentId: string) => void;
}

type TabType = 'workflow' | 'agents' | 'sources';

const STATUS_LABELS: Record<ProjectStatus, { ko: string; en: string }> = {
  initializing: { ko: '초기화 중', en: 'Initializing' },
  ready: { ko: '준비됨', en: 'Ready' },
  running: { ko: '실행 중', en: 'Running' },
  completed: { ko: '완료', en: 'Completed' },
  failed: { ko: '실패', en: 'Failed' },
  offline: { ko: '오프라인', en: 'Offline' },
};

export function ProjectDetail({
  project,
  onBack,
  onStartWorkflow,
  onStopWorkflow,
  onSubscribeAgentOutput,
}: ProjectDetailProps) {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('workflow');
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  const getStatusLabel = (status: ProjectStatus) => {
    const labels = STATUS_LABELS[status] || STATUS_LABELS.ready;
    return lang === 'ko' ? labels.ko : labels.en;
  };

  const handleAgentSelect = useCallback((agent: AgentInfo) => {
    setSelectedAgent(agent);
    if (onSubscribeAgentOutput) {
      onSubscribeAgentOutput(project.projectId, agent.id);
    }
  }, [project.projectId, onSubscribeAgentOutput]);

  const handleStartWorkflow = useCallback(() => {
    onStartWorkflow(project.projectId);
  }, [project.projectId, onStartWorkflow]);

  const handleStopWorkflow = useCallback(() => {
    onStopWorkflow(project.projectId);
  }, [project.projectId, onStopWorkflow]);

  const canStart = project.status === 'ready' || project.status === 'completed' || project.status === 'failed';
  const canStop = project.status === 'running';

  return (
    <div className="project-detail">
      {/* Header */}
      <div className="project-detail-header">
        <button className="back-btn" onClick={onBack}>
          ← {lang === 'ko' ? '목록' : 'Back'}
        </button>
        <div className="header-info">
          <h2 className="project-title">{project.name}</h2>
          <span className={`project-status-badge status-${project.status}`}>
            {getStatusLabel(project.status as ProjectStatus)}
          </span>
        </div>
      </div>

      {/* Mission */}
      {project.mission && (
        <div className="project-mission-section">
          <div className="section-label">{lang === 'ko' ? '미션' : 'Mission'}</div>
          <p className="mission-text">{project.mission}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="project-tabs">
        <button
          className={`tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflow')}
        >
          {lang === 'ko' ? '워크플로우' : 'Workflow'}
        </button>
        <button
          className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => setActiveTab('agents')}
        >
          {lang === 'ko' ? '에이전트' : 'Agents'}
          {project.agents && <span className="tab-count">{project.agents.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          {lang === 'ko' ? '소스' : 'Sources'}
          {project.sources && <span className="tab-count">{project.sources.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="project-tab-content">
        {activeTab === 'workflow' && (
          <div className="workflow-container">
            {project.agents && project.agents.length > 0 ? (
              <WorkflowGraph
                agents={project.agents}
                onAgentSelect={handleAgentSelect}
                selectedAgentId={selectedAgent?.id}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🔄</span>
                <p>{lang === 'ko' ? '워크플로우가 없습니다' : 'No workflow defined'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="agents-container">
            {selectedAgent ? (
              <AgentMonitor
                agent={selectedAgent}
                onBack={() => setSelectedAgent(null)}
              />
            ) : (
              <div className="agents-list">
                {project.agents && project.agents.length > 0 ? (
                  project.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="agent-card"
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <div className="agent-card-header">
                        <span className="agent-name">{agent.name}</span>
                        <span className={`agent-status status-${agent.status}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="agent-card-body">
                        <div className="agent-workdir">{agent.workDir}</div>
                        <div className="agent-tasks-count">
                          {agent.tasks.length} {lang === 'ko' ? '태스크' : 'tasks'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">👥</span>
                    <p>{lang === 'ko' ? '에이전트가 없습니다' : 'No agents'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-container">
            {project.sources && project.sources.length > 0 ? (
              <div className="sources-list">
                {project.sources.map((source, index) => (
                  <div key={index} className="source-item">
                    <span className="source-folder">📂 {source.folder}</span>
                    <span className="source-count">
                      {source.fileCount} {lang === 'ko' ? '파일' : 'files'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📂</span>
                <p>{lang === 'ko' ? '소스가 없습니다' : 'No sources'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="project-actions">
        {canStart && (
          <button className="action-btn start-btn" onClick={handleStartWorkflow}>
            ▶ {lang === 'ko' ? '워크플로우 시작' : 'Start Workflow'}
          </button>
        )}
        {canStop && (
          <button className="action-btn stop-btn" onClick={handleStopWorkflow}>
            ■ {lang === 'ko' ? '중지' : 'Stop'}
          </button>
        )}
      </div>
    </div>
  );
}
