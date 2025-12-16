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

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`;
const PLATFORM_API_URL = import.meta.env.VITE_PLATFORM_API_URL || 'https://api.sessioncast.io';

export function OnboardingGuide({ authToken }: OnboardingGuideProps) {
  const { t } = useLanguage();
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

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
      const listResponse = await fetch(`${API_URL}/api/tokens`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (listResponse.ok) {
        const data = await listResponse.json();
        if (data.tokens && data.tokens.length > 0) {
          setAgentToken(data.tokens[0]);
          return;
        }
      }

      const generateResponse = await fetch(`${API_URL}/api/tokens/generate`, {
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Use user's personal relay URL if available
  const relayUrl = userInfo?.relayUrl || 'wss://relay.sessioncast.io/ws';

  // Generate a suggested machineId based on platform
  const suggestedMachineId = navigator.platform?.toLowerCase().replace(/\s+/g, '-') || 'my-machine';

  const configContent = `# ~/.tmux-remote.yml
machineId: ${suggestedMachineId}
relay: ${relayUrl}
token: ${agentToken || 'loading...'}`;

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

      <div className="setup-steps">
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

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>{t('step2Title')}</h3>
            <p>{t('step2Desc')} <code>~/.tmux-remote.yml</code></p>
            <div className="config-block">
              <pre>{configContent}</pre>
              <button
                className="copy-btn"
                onClick={() => handleCopy(configContent)}
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>
            <div className="token-info">
              <span className="token-label">{t('yourAgentToken')}</span>
              <code className="token-value">{agentToken}</code>
              <button
                className="copy-token-btn"
                onClick={() => agentToken && handleCopy(agentToken)}
              >
                {t('copyToken')}
              </button>
            </div>
            {userInfo?.relayAlias && (
              <div className="relay-info">
                <span className="relay-label">{t('yourRelayUrl')}</span>
                <code className="relay-value">{relayUrl}</code>
                <button
                  className="copy-relay-btn"
                  onClick={() => handleCopy(relayUrl)}
                >
                  {t('copy')}
                </button>
              </div>
            )}
          </div>
        </div>

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

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>{t('step4Title')}</h3>
            <p>{t('step4Desc')}</p>
            <div className="code-block">
              <code>java -jar target/host-agent-1.0.0.jar</code>
            </div>
            <p className="hint">{t('step4Hint')}</p>
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
