import { ProjectInfo, ProjectStatus } from '../types';
import { useLanguage } from '../i18n';
import './ProjectList.css';

interface ProjectListProps {
  projects: ProjectInfo[];
  currentProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  onNewProject?: () => void;
}

const STATUS_LABELS: Record<ProjectStatus, { ko: string; en: string }> = {
  initializing: { ko: '초기화 중', en: 'Initializing' },
  ready: { ko: '준비됨', en: 'Ready' },
  running: { ko: '실행 중', en: 'Running' },
  completed: { ko: '완료', en: 'Completed' },
  failed: { ko: '실패', en: 'Failed' },
  offline: { ko: '오프라인', en: 'Offline' },
};

export function ProjectList({
  projects,
  currentProjectId,
  onSelectProject,
  onNewProject
}: ProjectListProps) {
  const { lang } = useLanguage();

  const getStatusLabel = (status: ProjectStatus) => {
    const labels = STATUS_LABELS[status] || STATUS_LABELS.ready;
    return lang === 'ko' ? labels.ko : labels.en;
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h3>{lang === 'ko' ? '프로젝트' : 'Projects'}</h3>
        {onNewProject && (
          <button className="new-project-btn" onClick={onNewProject}>
            + {lang === 'ko' ? '새 프로젝트' : 'New Project'}
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="project-list-empty">
          <div className="empty-icon">📁</div>
          <p>{lang === 'ko' ? '프로젝트가 없습니다' : 'No projects'}</p>
          <p className="empty-hint">
            {lang === 'ko' ? 'CLI에서 프로젝트를 등록하세요:' : 'Register a project from CLI:'}
          </p>
          <code>sessioncast project run . -r ws://...</code>
        </div>
      ) : (
        <div className="project-items">
          {projects.map((project) => (
            <div
              key={project.projectId}
              className={`project-item ${currentProjectId === project.projectId ? 'selected' : ''}`}
              onClick={() => onSelectProject?.(project.projectId)}
            >
              <div className="project-header">
                <span className="project-name">{project.name}</span>
                <span className={`project-status status-${project.status}`}>
                  {getStatusLabel(project.status as ProjectStatus)}
                </span>
              </div>
              <div className="project-details">
                <div className="project-path">{project.path}</div>
                {project.mission && (
                  <div className="project-mission">{project.mission}</div>
                )}
                <div className="project-meta">
                  {project.agents && project.agents.length > 0 && (
                    <span className="project-agents">
                      👥 {project.agents.length} {lang === 'ko' ? '에이전트' : 'agents'}
                    </span>
                  )}
                  {project.sources && project.sources.length > 0 && (
                    <span className="project-sources">
                      📂 {project.sources.length} {lang === 'ko' ? '소스' : 'sources'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
