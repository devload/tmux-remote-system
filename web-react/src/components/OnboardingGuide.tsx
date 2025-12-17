import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';
import './OnboardingGuide.css';

interface OnboardingGuideProps {
  authToken: string;
}

interface UserInfo {
  relayAlias?: string;
  relayUrl?: string;
  plan?: string;
}

type OS = 'mac' | 'windows' | 'linux';

const PLATFORM_API_URL = import.meta.env.VITE_PLATFORM_API_URL || 'https://api.sessioncast.io';

export function OnboardingGuide({ authToken }: OnboardingGuideProps) {
  const { t } = useLanguage();
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<OS>(() => {
    const platform = navigator.platform?.toLowerCase() || '';
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    return 'linux';
  });

  useEffect(() => {
    Promise.all([
      fetchOrCreateToken(),
      fetchUserInfo()
    ]).finally(() => setLoading(false));
  }, [authToken]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${PLATFORM_API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo({
          relayAlias: data.relayAlias,
          relayUrl: data.relayUrl,
          plan: data.plan
        });
      }
    } catch (e) {
      console.error('Failed to fetch user info', e);
    }
  };

  const fetchOrCreateToken = async () => {
    try {
      const listResponse = await fetch(`${PLATFORM_API_URL}/api/tokens`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        if (data.tokens && data.tokens.length > 0) {
          setAgentToken(data.tokens[0]);
          return;
        }
      }

      const generateResponse = await fetch(`${PLATFORM_API_URL}/api/tokens/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (generateResponse.ok) {
        const data = await generateResponse.json();
        setAgentToken(data.token);
      }
    } catch (e) {
      console.error('Failed to fetch/create token', e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const relayUrl = userInfo?.relayUrl || 'wss://relay.sessioncast.io/ws';
  const suggestedMachineId = navigator.platform?.toLowerCase().replace(/\s+/g, '-') || 'my-machine';

  const configContent = `# ~/.tmux-remote.yml
machineId: ${suggestedMachineId}
relay: ${relayUrl}
token: ${agentToken || 'loading...'}`;

  const aiPrompt = `Please help me install and configure SessionCast Agent on my machine.

Here is my configuration:
- Agent Token: ${agentToken || '[YOUR_TOKEN]'}
- Relay URL: ${relayUrl}
- Machine ID: ${suggestedMachineId}

Please:
1. Check if Java 17+ and tmux are installed, install them if not
2. Clone the repository: https://github.com/devload/tmux-remote-system.git
3. Build the agent with Maven
4. Create the config file at ~/.tmux-remote.yml with the above settings
5. Create a tmux session named 'work'
6. Start the agent

My OS is: ${selectedOS === 'mac' ? 'macOS' : selectedOS === 'windows' ? 'Windows (WSL)' : 'Linux'}`;

  if (loading) {
    return (
      <div className="onboarding-guide">
        <div className="loading-spinner">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="onboarding-guide">
      <div className="onboarding-header">
        <h1>{t('welcome')}</h1>
        <p>{t('noMachines')}</p>
      </div>

      {/* OS Selector */}
      <div className="os-selector">
        <button
          className={`os-btn ${selectedOS === 'mac' ? 'active' : ''}`}
          onClick={() => setSelectedOS('mac')}
        >
          <span className="os-icon">🍎</span> macOS
        </button>
        <button
          className={`os-btn ${selectedOS === 'windows' ? 'active' : ''}`}
          onClick={() => setSelectedOS('windows')}
        >
          <span className="os-icon">🪟</span> Windows
        </button>
        <button
          className={`os-btn ${selectedOS === 'linux' ? 'active' : ''}`}
          onClick={() => setSelectedOS('linux')}
        >
          <span className="os-icon">🐧</span> Linux
        </button>
      </div>

      {/* AI Auto-Install Section */}
      <div className="ai-install-section">
        <div className="ai-header">
          <span className="ai-icon">🤖</span>
          <h3>{t('aiInstallTitle')}</h3>
        </div>
        <p className="ai-desc">{t('aiInstallDesc')}</p>
        <div className="ai-prompt-block">
          <pre>{aiPrompt}</pre>
          <button
            className="copy-btn"
            onClick={() => handleCopy(aiPrompt, 'ai-prompt')}
          >
            {copied === 'ai-prompt' ? t('copied') : t('copyPrompt')}
          </button>
        </div>
        <div className="ai-tools">
          <span className="ai-tool-label">{t('compatibleWith')}</span>
          <span className="ai-tool">Claude Code</span>
          <span className="ai-tool">Gemini</span>
          <span className="ai-tool">ChatGPT</span>
          <span className="ai-tool">Cursor</span>
        </div>
      </div>

      <div className="divider">
        <span>{t('orManualInstall')}</span>
      </div>

      <div className="setup-steps">
        {/* Step 0: Prerequisites */}
        <div className="step prerequisite-step">
          <div className="step-number">0</div>
          <div className="step-content">
            <h3>{t('prerequisitesTitle')}</h3>
            <p>{t('prerequisitesDesc')}</p>

            <div className="prereq-grid">
              <div className="prereq-item">
                <div className="prereq-header">
                  <span className="prereq-icon">☕</span>
                  <strong>Java 17+</strong>
                </div>
                {selectedOS === 'mac' && (
                  <div className="code-block">
                    <code>brew install openjdk@17</code>
                  </div>
                )}
                {selectedOS === 'windows' && (
                  <div className="code-block">
                    <code># WSL/Ubuntu</code>
                    <code>sudo apt update && sudo apt install openjdk-17-jdk</code>
                  </div>
                )}
                {selectedOS === 'linux' && (
                  <div className="code-block">
                    <code># Ubuntu/Debian</code>
                    <code>sudo apt update && sudo apt install openjdk-17-jdk</code>
                    <code></code>
                    <code># RHEL/CentOS</code>
                    <code>sudo dnf install java-17-openjdk-devel</code>
                  </div>
                )}
              </div>

              <div className="prereq-item">
                <div className="prereq-header">
                  <span className="prereq-icon">📟</span>
                  <strong>tmux</strong>
                </div>
                {selectedOS === 'mac' && (
                  <div className="code-block">
                    <code>brew install tmux</code>
                  </div>
                )}
                {selectedOS === 'windows' && (
                  <div className="code-block">
                    <code># WSL/Ubuntu</code>
                    <code>sudo apt update && sudo apt install tmux</code>
                  </div>
                )}
                {selectedOS === 'linux' && (
                  <div className="code-block">
                    <code># Ubuntu/Debian</code>
                    <code>sudo apt update && sudo apt install tmux</code>
                    <code></code>
                    <code># RHEL/CentOS</code>
                    <code>sudo dnf install tmux</code>
                  </div>
                )}
              </div>

              {selectedOS === 'mac' && (
                <div className="prereq-item full-width">
                  <div className="prereq-header">
                    <span className="prereq-icon">🍺</span>
                    <strong>Homebrew ({t('ifNotInstalled')})</strong>
                  </div>
                  <div className="code-block">
                    <code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"</code>
                  </div>
                </div>
              )}

              {selectedOS === 'windows' && (
                <div className="prereq-item full-width">
                  <div className="prereq-header">
                    <span className="prereq-icon">🐧</span>
                    <strong>WSL2 ({t('required')})</strong>
                  </div>
                  <div className="code-block">
                    <code># PowerShell (Administrator)</code>
                    <code>wsl --install</code>
                  </div>
                  <p className="prereq-note">{t('wslNote')}</p>
                </div>
              )}
            </div>

            <div className="verify-commands">
              <p className="verify-label">{t('verifyInstall')}</p>
              <div className="code-block">
                <code>java -version</code>
                <code>tmux -V</code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Clone & Build */}
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>{t('step1Title')}</h3>
            <p>{t('step1Desc')}</p>
            <div className="code-block">
              <code>git clone https://github.com/devload/tmux-remote-system.git</code>
              <code>cd tmux-remote-system/agent-spring</code>
              <code>./mvnw clean package -DskipTests</code>
            </div>
          </div>
        </div>

        {/* Step 2: Config */}
        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>{t('step2Title')}</h3>
            <p>{t('step2Desc')} <code>~/.tmux-remote.yml</code></p>
            <div className="config-block">
              <pre>{configContent}</pre>
              <button
                className="copy-btn"
                onClick={() => handleCopy(configContent, 'config')}
              >
                {copied === 'config' ? t('copied') : t('copy')}
              </button>
            </div>
            <div className="token-info">
              <span className="token-label">{t('yourAgentToken')}</span>
              <code className="token-value">{agentToken}</code>
              <button
                className="copy-token-btn"
                onClick={() => agentToken && handleCopy(agentToken, 'token')}
              >
                {copied === 'token' ? t('copied') : t('copyToken')}
              </button>
            </div>
            {userInfo?.relayAlias && (
              <div className="relay-info">
                <span className="relay-label">{t('yourRelayUrl')}</span>
                <code className="relay-value">{relayUrl}</code>
                <button
                  className="copy-relay-btn"
                  onClick={() => handleCopy(relayUrl, 'relay')}
                >
                  {copied === 'relay' ? t('copied') : t('copy')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Create tmux session */}
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>{t('step3Title')}</h3>
            <p>{t('step3Desc')}</p>
            <div className="code-block">
              <code>tmux new-session -d -s work</code>
            </div>
          </div>
        </div>

        {/* Step 4: Run Agent */}
        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>{t('step4Title')}</h3>
            <p>{t('step4Desc')}</p>
            <div className="code-block">
              <code>java -jar target/host-agent-1.0.0.jar</code>
            </div>
            <p className="hint">{t('step4Hint')}</p>

            <div className="background-tip">
              <strong>{t('runInBackground')}</strong>
              <div className="code-block">
                <code>nohup java -jar target/host-agent-1.0.0.jar &gt; agent.log 2&gt;&amp;1 &amp;</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-footer">
        <p>{t('footerConnected')}</p>
        <p className="security-note">{t('footerSecurity')}</p>
      </div>
    </div>
  );
}
