import { useState, useEffect, useCallback } from 'react';
import './ApiKeyManager.css';

interface ApiKeyManagerProps {
  authToken: string;
  onClose: () => void;
  onOpenAgentSettings?: () => void;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimitPerHour: number;
  lastUsedAt: string | null;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`;

export function ApiKeyManager({ authToken, onClose, onOpenAgentSettings }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['llm:chat', 'exec:run']);

  const availableScopes = [
    { value: 'llm:chat', label: 'LLM Chat', description: 'Call LLM models on your agents' },
    { value: 'exec:run', label: 'Command Execution', description: 'Execute commands on your agents' },
    { value: 'agents:read', label: 'Read Agents', description: 'List and view agent status' },
    { value: '*', label: 'Full Access', description: 'All permissions' },
  ];

  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/api-keys`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch API keys', e);
    }
  }, [authToken]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/api-keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newKeyName,
          scopes: selectedScopes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKey(data.rawKey);
        setShowCreateForm(false);
        setNewKeyName('');
        fetchApiKeys();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create API key');
      }
    } catch (e) {
      setError('Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (e) {
      console.error('Failed to revoke API key', e);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="api-key-manager-overlay" onClick={onClose}>
      <div className="api-key-manager" onClick={e => e.stopPropagation()}>
        <div className="api-key-manager-header">
          <h2>🔑 API Keys</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="api-key-manager-content">
          <p className="api-key-description">
            Use API keys to access SessionCast from external services like n8n, GitHub Actions, or custom integrations.
            {onOpenAgentSettings && (
              <>
                {' '}
                <button
                  className="link-btn"
                  onClick={() => {
                    onClose();
                    onOpenAgentSettings();
                  }}
                >
                  Configure Agent API settings →
                </button>
              </>
            )}
          </p>

          {error && <div className="api-key-error">{error}</div>}

          {newKey && (
            <div className="new-key-box">
              <div className="new-key-label">
                ⚠️ Copy this API key now. You won't be able to see it again!
              </div>
              <div className="new-key-value">
                <code>{newKey}</code>
                <button onClick={() => handleCopy(newKey)}>Copy</button>
              </div>
            </div>
          )}

          {showCreateForm ? (
            <div className="create-key-form">
              <h3>Create New API Key</h3>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g., n8n-integration"
                />
              </div>

              <div className="form-group">
                <label>Permissions</label>
                <div className="scope-list">
                  {availableScopes.map(scope => (
                    <label key={scope.value} className="scope-item">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                      />
                      <div className="scope-info">
                        <span className="scope-label">{scope.label}</span>
                        <span className="scope-desc">{scope.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="create-btn"
                  onClick={handleCreateKey}
                  disabled={loading || !newKeyName.trim()}
                >
                  {loading ? 'Creating...' : 'Create API Key'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="add-key-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Create New API Key
            </button>
          )}

          <div className="api-key-list">
            <h3>Your API Keys ({apiKeys.length})</h3>
            {apiKeys.length === 0 ? (
              <p className="no-keys">No API keys yet. Create one to get started.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key</th>
                    <th>Permissions</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(key => (
                    <tr key={key.id}>
                      <td>{key.name}</td>
                      <td><code>{key.keyPrefix}...</code></td>
                      <td>
                        <div className="scope-badges">
                          {key.scopes.map(scope => (
                            <span key={scope} className="scope-badge">{scope}</span>
                          ))}
                        </div>
                      </td>
                      <td>{formatDate(key.lastUsedAt)}</td>
                      <td>
                        <button
                          className="revoke-btn"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="api-usage-example">
            <h3>📚 Usage Example</h3>
            <div className="code-tabs">
              <div className="code-tab">
                <h4>cURL</h4>
                <pre>{`curl -X POST "${API_URL}/api/v1/agents/{agentId}/exec" \\
  -H "Authorization: Bearer ${newKey || 'sk-xxx...'}" \\
  -H "Content-Type: application/json" \\
  -d '{"command": "echo Hello World"}'`}</pre>
              </div>

              <div className="code-tab">
                <h4>OpenAI-Compatible LLM</h4>
                <pre>{`curl -X POST "${API_URL}/api/v1/chat/completions" \\
  -H "Authorization: Bearer ${newKey || 'sk-xxx...'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "agent:{agentId}:llama2",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</pre>
              </div>

              <div className="code-tab">
                <h4>n8n HTTP Request</h4>
                <pre>{`URL: ${API_URL}/api/v1/agents/{agentId}/llm/chat
Method: POST
Headers:
  Authorization: Bearer ${newKey || 'sk-xxx...'}
  Content-Type: application/json
Body:
{
  "messages": [{"role": "user", "content": "Summarize this..."}]
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
