import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n';
import './AgentApiSettings.css';

interface AgentApiSettingsProps {
  authToken: string;
  onClose: () => void;
}

interface Agent {
  id: string;
  token: string;
  label: string | null;
  machineId: string | null;
  lastConnectedAt: string | null;
  isActive: boolean;
  apiEnabled: boolean;
  apiConfig: Record<string, any> | null;
  createdAt: string;
}

interface ApiConfig {
  exec: {
    enabled: boolean;
    shell: string;
    defaultTimeout: number;
  };
  llm: {
    enabled: boolean;
    provider: string;
    baseUrl: string;
    model: string;
  };
}

const defaultConfig: ApiConfig = {
  exec: {
    enabled: true,
    shell: '/bin/bash',
    defaultTimeout: 30000,
  },
  llm: {
    enabled: true,
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
  },
};

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`;

export function AgentApiSettings({ authToken, onClose }: AgentApiSettingsProps) {
  const { lang } = useLanguage();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [config, setConfig] = useState<ApiConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data || []);
        if (data.length > 0 && !selectedAgent) {
          setSelectedAgent(data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch agents', e);
    } finally {
      setLoading(false);
    }
  }, [authToken, selectedAgent]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Load config when selected agent changes
  useEffect(() => {
    if (selectedAgent?.apiConfig) {
      const agentConfig = selectedAgent.apiConfig as Partial<ApiConfig>;
      setConfig({
        exec: {
          enabled: agentConfig.exec?.enabled ?? defaultConfig.exec.enabled,
          shell: agentConfig.exec?.shell ?? defaultConfig.exec.shell,
          defaultTimeout: agentConfig.exec?.defaultTimeout ?? defaultConfig.exec.defaultTimeout,
        },
        llm: {
          enabled: agentConfig.llm?.enabled ?? defaultConfig.llm.enabled,
          provider: agentConfig.llm?.provider ?? defaultConfig.llm.provider,
          baseUrl: agentConfig.llm?.baseUrl ?? defaultConfig.llm.baseUrl,
          model: agentConfig.llm?.model ?? defaultConfig.llm.model,
        },
      });
    } else {
      setConfig(defaultConfig);
    }
    setHasChanges(false);
  }, [selectedAgent]);

  const handleToggleApi = async (enabled: boolean) => {
    if (!selectedAgent) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/agents/${selectedAgent.id}/api-settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiEnabled: enabled,
          apiConfig: config,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedAgent(updated);
        setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
        setHasChanges(false);
      }
    } catch (e) {
      console.error('Failed to update API settings', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedAgent) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/agents/${selectedAgent.id}/api-settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiEnabled: selectedAgent.apiEnabled,
          apiConfig: config,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSelectedAgent(updated);
        setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
        setHasChanges(false);
      }
    } catch (e) {
      console.error('Failed to save config', e);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: 'exec' | 'llm', field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return lang === 'ko' ? '없음' : 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const isOnline = (agent: Agent) => {
    if (!agent.lastConnectedAt) return false;
    const lastConnected = new Date(agent.lastConnectedAt).getTime();
    const now = Date.now();
    return now - lastConnected < 60000; // Within 1 minute
  };

  return (
    <div className="agent-api-overlay" onClick={onClose}>
      <div className="agent-api-modal" onClick={e => e.stopPropagation()}>
        <div className="agent-api-header">
          <h2>⚙️ Agent API Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="agent-api-content">
          {loading ? (
            <div className="loading">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="no-agents">
              <p>{lang === 'ko' ? 'Agent가 없습니다.' : 'No agents found.'}</p>
              <p className="hint">
                {lang === 'ko'
                  ? 'Agent Token을 생성하고 로컬 머신에서 agent를 실행하세요.'
                  : 'Generate an Agent Token and run the agent on your local machine.'}
              </p>
            </div>
          ) : (
            <>
              {/* Agent Selector */}
              {agents.length > 1 && (
                <div className="agent-selector">
                  <label>Select Agent:</label>
                  <select
                    value={selectedAgent?.id || ''}
                    onChange={e => {
                      const agent = agents.find(a => a.id === e.target.value);
                      setSelectedAgent(agent || null);
                    }}
                  >
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>
                        {agent.label || agent.machineId || agent.id.substring(0, 8)}
                        {isOnline(agent) ? ' (Online)' : ' (Offline)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedAgent && (
                <div className="agent-details">
                  {/* Agent Info */}
                  <div className="info-section">
                    <h3>Agent Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Status:</span>
                        <span className={`status ${isOnline(selectedAgent) ? 'online' : 'offline'}`}>
                          {isOnline(selectedAgent)
                            ? (lang === 'ko' ? '온라인' : 'Online')
                            : (lang === 'ko' ? '오프라인' : 'Offline')}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Label:</span>
                        <span>{selectedAgent.label || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Machine ID:</span>
                        <span>{selectedAgent.machineId || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Last Connected:</span>
                        <span>{formatDate(selectedAgent.lastConnectedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* API Settings */}
                  <div className="api-section">
                    <h3>API Access</h3>
                    <div className="api-toggle">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={selectedAgent.apiEnabled}
                          onChange={e => handleToggleApi(e.target.checked)}
                          disabled={saving}
                        />
                        <span className="toggle-text">
                          {lang === 'ko' ? 'API 접근 허용' : 'Enable API Access'}
                        </span>
                      </label>
                      <p className="toggle-desc">
                        {lang === 'ko'
                          ? '외부 서비스(n8n, GitHub Actions 등)에서 이 Agent로 명령 실행 및 LLM 호출 허용'
                          : 'Allow external services (n8n, GitHub Actions, etc.) to execute commands and call LLM on this agent'}
                      </p>
                    </div>

                    {selectedAgent.apiEnabled && (
                      <div className="api-details">
                        {/* Agent ID for API */}
                        <div className="copyable-field">
                          <label>Agent ID (for API calls):</label>
                          <div className="copy-row">
                            <code>{selectedAgent.id}</code>
                            <button
                              onClick={() => handleCopy(selectedAgent.id, 'id')}
                              className={copied === 'id' ? 'copied' : ''}
                            >
                              {copied === 'id' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {/* Config Editor */}
                        <div className="config-section">
                          <div className="config-header">
                            <h4>{lang === 'ko' ? 'Agent 설정' : 'Agent Configuration'}</h4>
                            {hasChanges && (
                              <button
                                className="save-config-btn"
                                onClick={handleSaveConfig}
                                disabled={saving}
                              >
                                {saving ? (lang === 'ko' ? '저장 중...' : 'Saving...') : (lang === 'ko' ? '저장' : 'Save')}
                              </button>
                            )}
                          </div>

                          {/* Exec Configuration */}
                          <div className="config-group">
                            <div className="config-group-header">
                              <label className="toggle-label">
                                <input
                                  type="checkbox"
                                  checked={config.exec.enabled}
                                  onChange={e => updateConfig('exec', 'enabled', e.target.checked)}
                                />
                                <span className="toggle-text">
                                  {lang === 'ko' ? '명령어 실행' : 'Command Execution'}
                                </span>
                              </label>
                            </div>
                            {config.exec.enabled && (
                              <div className="config-fields">
                                <div className="config-field">
                                  <label>{lang === 'ko' ? '쉘' : 'Shell'}:</label>
                                  <input
                                    type="text"
                                    value={config.exec.shell}
                                    onChange={e => updateConfig('exec', 'shell', e.target.value)}
                                    placeholder="/bin/bash"
                                  />
                                </div>
                                <div className="config-field">
                                  <label>{lang === 'ko' ? '기본 타임아웃 (ms)' : 'Default Timeout (ms)'}:</label>
                                  <input
                                    type="number"
                                    value={config.exec.defaultTimeout}
                                    onChange={e => updateConfig('exec', 'defaultTimeout', parseInt(e.target.value) || 30000)}
                                    placeholder="30000"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* LLM Configuration */}
                          <div className="config-group">
                            <div className="config-group-header">
                              <label className="toggle-label">
                                <input
                                  type="checkbox"
                                  checked={config.llm.enabled}
                                  onChange={e => updateConfig('llm', 'enabled', e.target.checked)}
                                />
                                <span className="toggle-text">
                                  {lang === 'ko' ? 'LLM 연동' : 'LLM Integration'}
                                </span>
                              </label>
                            </div>
                            {config.llm.enabled && (
                              <div className="config-fields">
                                <div className="config-field">
                                  <label>{lang === 'ko' ? '프로바이더' : 'Provider'}:</label>
                                  <select
                                    value={config.llm.provider}
                                    onChange={e => updateConfig('llm', 'provider', e.target.value)}
                                  >
                                    <option value="ollama">Ollama</option>
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                </div>
                                <div className="config-field">
                                  <label>{lang === 'ko' ? 'Base URL' : 'Base URL'}:</label>
                                  <input
                                    type="text"
                                    value={config.llm.baseUrl}
                                    onChange={e => updateConfig('llm', 'baseUrl', e.target.value)}
                                    placeholder="http://localhost:11434"
                                  />
                                </div>
                                <div className="config-field">
                                  <label>{lang === 'ko' ? '모델' : 'Model'}:</label>
                                  <input
                                    type="text"
                                    value={config.llm.model}
                                    onChange={e => updateConfig('llm', 'model', e.target.value)}
                                    placeholder="llama2"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* YAML Preview */}
                          <div className="config-preview">
                            <h5>{lang === 'ko' ? 'Agent 설정 파일 (~/.tmux-remote.yml)' : 'Agent Config File (~/.tmux-remote.yml)'}</h5>
                            <pre className="config-code">
{`# API Configuration
api:
  enabled: true
  agentId: "${selectedAgent.id}"

  # Command execution
  exec:
    enabled: ${config.exec.enabled}
    shell: ${config.exec.shell}
    defaultTimeout: ${config.exec.defaultTimeout}

  # LLM
  llm:
    enabled: ${config.llm.enabled}
    provider: ${config.llm.provider}
    baseUrl: ${config.llm.baseUrl}
    model: ${config.llm.model}`}
                            </pre>
                            <button
                              className="copy-config-btn"
                              onClick={() => handleCopy(`api:
  enabled: true
  agentId: "${selectedAgent.id}"
  exec:
    enabled: ${config.exec.enabled}
    shell: ${config.exec.shell}
    defaultTimeout: ${config.exec.defaultTimeout}
  llm:
    enabled: ${config.llm.enabled}
    provider: ${config.llm.provider}
    baseUrl: ${config.llm.baseUrl}
    model: ${config.llm.model}`, 'config')}
                            >
                              {copied === 'config' ? 'Copied!' : (lang === 'ko' ? '설정 복사' : 'Copy Configuration')}
                            </button>
                          </div>
                        </div>

                        {/* API Examples */}
                        <div className="examples-section">
                          <h4>API Usage Examples</h4>

                          <div className="example">
                            <h5>Execute Command</h5>
                            <pre>
{`curl -X POST "${API_URL}/api/v1/agents/${selectedAgent.id}/exec" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"command": "echo Hello World"}'`}
                            </pre>
                          </div>

                          <div className="example">
                            <h5>LLM Chat (OpenAI Compatible)</h5>
                            <pre>
{`curl -X POST "${API_URL}/api/v1/agents/${selectedAgent.id}/llm/chat" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
                            </pre>
                          </div>

                          <div className="example">
                            <h5>OpenAI SDK Compatible</h5>
                            <pre>
{`from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${API_URL}/api/v1"
)

response = client.chat.completions.create(
    model="agent:${selectedAgent.id}:llama2",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
