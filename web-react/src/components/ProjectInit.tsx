import { useState, useCallback } from 'react';
import { SessionInfo } from '../types';
import { useLanguage } from '../i18n';
import './ProjectInit.css';

interface ProjectInitProps {
  sessions: SessionInfo[];
  onInit: (machineId: string, projectName: string, projectPath: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ProjectInit({ sessions, onInit, onClose, isLoading = false }: ProjectInitProps) {
  const { lang } = useLanguage();
  const [selectedMachine, setSelectedMachine] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [error, setError] = useState('');

  // Get unique machine IDs from online sessions
  const machines = Array.from(
    new Set(
      sessions
        .filter(s => s.status === 'online')
        .map(s => s.machineId)
    )
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMachine) {
      setError(lang === 'ko' ? '에이전트를 선택하세요' : 'Please select an agent');
      return;
    }
    if (!projectName.trim()) {
      setError(lang === 'ko' ? '프로젝트 이름을 입력하세요' : 'Please enter project name');
      return;
    }
    if (!projectPath.trim()) {
      setError(lang === 'ko' ? '프로젝트 경로를 입력하세요' : 'Please enter project path');
      return;
    }

    onInit(selectedMachine, projectName.trim(), projectPath.trim());
  }, [selectedMachine, projectName, projectPath, onInit, lang]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="project-init-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="project-init-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{lang === 'ko' ? '새 프로젝트' : 'New Project'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="machine">
              {lang === 'ko' ? '에이전트' : 'Agent'}
            </label>
            <select
              id="machine"
              value={selectedMachine}
              onChange={e => setSelectedMachine(e.target.value)}
              disabled={isLoading}
            >
              <option value="">
                {lang === 'ko' ? '에이전트 선택...' : 'Select agent...'}
              </option>
              {machines.map(machineId => (
                <option key={machineId} value={machineId}>
                  {machineId}
                </option>
              ))}
            </select>
            {machines.length === 0 && (
              <p className="hint">
                {lang === 'ko'
                  ? '온라인 에이전트가 없습니다. CLI에서 에이전트를 시작하세요.'
                  : 'No online agents. Start an agent from CLI.'}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="projectName">
              {lang === 'ko' ? '프로젝트 이름' : 'Project Name'}
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder={lang === 'ko' ? '예: my-project' : 'e.g., my-project'}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="projectPath">
              {lang === 'ko' ? '프로젝트 경로' : 'Project Path'}
            </label>
            <input
              type="text"
              id="projectPath"
              value={projectPath}
              onChange={e => setProjectPath(e.target.value)}
              placeholder={lang === 'ko' ? '예: /home/user/projects/my-project' : 'e.g., /home/user/projects/my-project'}
              disabled={isLoading}
            />
            <p className="hint">
              {lang === 'ko'
                ? '에이전트 시스템의 절대 경로를 입력하세요'
                : 'Enter absolute path on the agent system'}
            </p>
          </div>

          {error && (
            <div className="form-error">{error}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              {lang === 'ko' ? '취소' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading || machines.length === 0}
            >
              {isLoading
                ? (lang === 'ko' ? '생성 중...' : 'Creating...')
                : (lang === 'ko' ? '프로젝트 생성' : 'Create Project')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
