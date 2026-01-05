import { useState, useCallback } from 'react';
import './AutoPilot.css';
import { DependencyGraph } from './DependencyGraph';

interface AutoPilotProps {
  onExecute: (prompt: string, options: { quick?: boolean; speckit?: boolean }) => void;
  disabled?: boolean;
  status?: AutoPilotStatus | null;
  result?: AutoPilotResult | null;
}

export interface AutoPilotStatus {
  phase: 'idle' | 'detecting' | 'scanning' | 'analyzing' | 'generating' | 'ready' | 'error';
  message?: string;
}

export interface AutoPilotResult {
  success: boolean;
  projectType?: string;
  projectName?: string;
  workflow?: {
    name: string;
    mission: string;
    agents: Array<{ id: string; name: string; workDir: string; tasks: string[] }>;
  };
  summary?: string;
  speckit?: {
    planMd: string;
    tasksMd: string;
  };
  error?: string;
}

const PHASE_LABELS: Record<string, string> = {
  idle: '대기 중',
  detecting: '프로젝트 감지 중...',
  scanning: '소스 파일 스캔 중...',
  analyzing: '미션 분석 중...',
  generating: '워크플로우 생성 중...',
  ready: '완료',
  error: '오류 발생'
};

const EXAMPLE_PROMPTS = [
  '로그인 기능 구현',
  'API 에러 핸들링 추가',
  '다크모드 지원',
  '유닛 테스트 작성',
  '성능 최적화',
  '코드 리팩토링'
];

export function AutoPilot({ onExecute, disabled, status, result }: AutoPilotProps) {
  const [prompt, setPrompt] = useState('');
  const [quickMode, setQuickMode] = useState(true);
  const [speckitMode, setSpeckitMode] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeckit, setShowSpeckit] = useState<'plan' | 'tasks' | 'graph' | null>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !disabled) {
      onExecute(prompt.trim(), { quick: quickMode, speckit: speckitMode });
    }
  }, [prompt, quickMode, speckitMode, disabled, onExecute]);

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
  }, []);

  const isProcessing = Boolean(status && !['idle', 'ready', 'error'].includes(status.phase));

  return (
    <div className={`autopilot-container ${isExpanded ? 'expanded' : ''}`}>
      <div className="autopilot-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="autopilot-icon">🚀</span>
        <span className="autopilot-title">AutoPilot</span>
        <span className="autopilot-subtitle">단일 프롬프트로 워크플로우 생성</span>
        <span className={`autopilot-toggle ${isExpanded ? 'open' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <div className="autopilot-content">
          <form onSubmit={handleSubmit} className="autopilot-form">
            <div className="autopilot-input-wrapper">
              <textarea
                className="autopilot-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="무엇을 만들어 드릴까요? (예: 로그인 기능 구현)"
                disabled={disabled || isProcessing}
                rows={3}
              />
              <div className="autopilot-options">
                <label className="autopilot-checkbox">
                  <input
                    type="checkbox"
                    checked={quickMode}
                    onChange={(e) => setQuickMode(e.target.checked)}
                    disabled={disabled || isProcessing}
                  />
                  <span>빠른 모드 (LLM 분석 스킵)</span>
                </label>
                <label className="autopilot-checkbox">
                  <input
                    type="checkbox"
                    checked={speckitMode}
                    onChange={(e) => setSpeckitMode(e.target.checked)}
                    disabled={disabled || isProcessing}
                  />
                  <span>📋 Speckit 생성 (plan.md + tasks.md)</span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="autopilot-submit"
              disabled={disabled || isProcessing || !prompt.trim()}
            >
              {isProcessing ? '처리 중...' : '워크플로우 생성'}
            </button>
          </form>

          <div className="autopilot-examples">
            <span className="examples-label">예시:</span>
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                className="example-chip"
                onClick={() => handleExampleClick(example)}
                disabled={disabled || isProcessing}
              >
                {example}
              </button>
            ))}
          </div>

          {status && status.phase !== 'idle' && (
            <div className={`autopilot-status ${status.phase}`}>
              <div className="status-indicator">
                {isProcessing && <span className="spinner"></span>}
                {status.phase === 'ready' && <span className="check">✓</span>}
                {status.phase === 'error' && <span className="error">✕</span>}
              </div>
              <div className="status-text">
                <span className="status-phase">{PHASE_LABELS[status.phase]}</span>
                {status.message && <span className="status-message">{status.message}</span>}
              </div>
            </div>
          )}

          {result && result.success && result.workflow && (
            <div className="autopilot-result">
              <div className="result-header">
                <span className="result-icon">📋</span>
                <span className="result-title">생성된 워크플로우</span>
              </div>
              <div className="result-info">
                <div className="info-row">
                  <span className="info-label">프로젝트:</span>
                  <span className="info-value">{result.projectName} ({result.projectType})</span>
                </div>
                <div className="info-row">
                  <span className="info-label">미션:</span>
                  <span className="info-value">{result.workflow.mission}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">에이전트:</span>
                  <span className="info-value">{result.workflow.agents.length}개</span>
                </div>
              </div>
              <div className="result-agents">
                {result.workflow.agents.map((agent) => (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-tasks">
                      {agent.tasks.map((task, i) => (
                        <div key={i} className="task-item">• {task}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {result.summary && (
                <div className="result-summary">
                  <pre>{result.summary}</pre>
                </div>
              )}
              {result.speckit && (
                <div className="speckit-viewer">
                  <div className="speckit-header">
                    <span className="speckit-icon">📋</span>
                    <span className="speckit-title">Speckit</span>
                    <div className="speckit-tabs">
                      <button
                        className={`speckit-tab ${showSpeckit === 'plan' ? 'active' : ''}`}
                        onClick={() => setShowSpeckit(showSpeckit === 'plan' ? null : 'plan')}
                      >
                        plan.md
                      </button>
                      <button
                        className={`speckit-tab ${showSpeckit === 'tasks' ? 'active' : ''}`}
                        onClick={() => setShowSpeckit(showSpeckit === 'tasks' ? null : 'tasks')}
                      >
                        tasks.md
                      </button>
                      <button
                        className={`speckit-tab ${showSpeckit === 'graph' ? 'active' : ''}`}
                        onClick={() => setShowSpeckit(showSpeckit === 'graph' ? null : 'graph')}
                      >
                        🔗 Graph
                      </button>
                    </div>
                  </div>
                  {showSpeckit === 'plan' && (
                    <div className="speckit-content">
                      <pre className="speckit-markdown">{result.speckit.planMd}</pre>
                    </div>
                  )}
                  {showSpeckit === 'tasks' && (
                    <div className="speckit-content">
                      <pre className="speckit-markdown">{result.speckit.tasksMd}</pre>
                    </div>
                  )}
                  {showSpeckit === 'graph' && (
                    <DependencyGraph tasksMd={result.speckit.tasksMd} />
                  )}
                </div>
              )}
            </div>
          )}

          {result && !result.success && (
            <div className="autopilot-error">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{result.error || '워크플로우 생성에 실패했습니다.'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
