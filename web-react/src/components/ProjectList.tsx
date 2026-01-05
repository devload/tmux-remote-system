import { ProjectInfo } from '../types';
import './ProjectList.css';

interface ProjectListProps {
  projects: ProjectInfo[];
  onSelectProject?: (projectId: string) => void;
}

export function ProjectList({ projects, onSelectProject }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="project-list-empty">
        <div className="empty-icon">📁</div>
        <p>프로젝트가 없습니다</p>
        <p className="empty-hint">CLI에서 프로젝트를 등록하세요:</p>
        <code>sessioncast project run . -r ws://...</code>
      </div>
    );
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <div
          key={project.projectId}
          className="project-item"
          onClick={() => onSelectProject?.(project.projectId)}
        >
          <div className="project-header">
            <span className="project-name">{project.name}</span>
            <span className={`project-status status-${project.status}`}>
              {project.status}
            </span>
          </div>
          <div className="project-details">
            <div className="project-path">{project.path}</div>
            {project.mission && <div className="project-mission">{project.mission}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
