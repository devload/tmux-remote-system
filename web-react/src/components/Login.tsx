import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export function Login({ onLoginSuccess }: LoginProps) {
  const { t, lang, setLang } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for token in URL (redirect from OAuth)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (token) {
      // Store token and notify parent
      localStorage.setItem('auth_token', token);
      onLoginSuccess(token);
      // Clean URL
      window.history.replaceState({}, document.title, '/');
    }

    if (errorParam) {
      if (errorParam === 'domain_not_allowed') {
        setError(t('domainNotAllowed'));
      } else if (errorParam === 'oauth_failed') {
        setError(t('loginFailed'));
      } else {
        setError(t('loginFailed'));
      }
    }
  }, [onLoginSuccess, t]);

  const handleGoogleLogin = () => {
    setLoading(true);
    // Redirect to Spring Security OAuth2 endpoint
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="login-container">
      {/* Language toggle - page level */}
      <div className="lang-toggle">
        <button
          className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <span className="lang-divider">|</span>
        <button
          className={`lang-btn ${lang === 'ko' ? 'active' : ''}`}
          onClick={() => setLang('ko')}
        >
          KO
        </button>
      </div>

      {/* Background decoration */}
      <div className="login-bg-decoration">
        <div className="bg-circle bg-circle-1"></div>
        <div className="bg-circle bg-circle-2"></div>
        <div className="bg-circle bg-circle-3"></div>
      </div>

      <div className="login-content">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="brand-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M12 20L18 26L12 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 32H36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="38" cy="14" r="2" fill="currentColor"/>
              <circle cx="32" cy="14" r="2" fill="currentColor"/>
              <circle cx="26" cy="14" r="2" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="brand-title">{t('loginTitle')}</h1>
          <p className="brand-tagline">{t('loginTagline')}</p>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">{t('featureSecure')}</span>
                <span className="feature-desc">{t('featureSecureDesc')}</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">{t('featureRealtime')}</span>
                <span className="feature-desc">{t('featureRealtimeDesc')}</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8"/>
                  <path d="M12 17v4"/>
                  <path d="M7 8h2"/>
                  <path d="M7 11h4"/>
                </svg>
              </div>
              <div className="feature-text">
                <span className="feature-title">{t('featureMulti')}</span>
                <span className="feature-desc">{t('featureMultiDesc')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login card */}
        <div className="login-card">
          <div className="login-header">
            <h2>{t('loginSubtitle')}</h2>
          </div>

          {/* Announcement */}
          <div className="announcement-box">
            <div className="announcement-badge">{t('announcement')}</div>
            <div className="announcement-content">
              <strong>{t('announcementBeta')}</strong>
              <p>{t('announcementBetaDesc')}</p>
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? `${t('loading')}` : t('loginWithGoogle')}
          </button>

          <div className="login-footer">
            <p>{lang === 'ko' ? '로그인하면 서비스 이용약관에 동의하게 됩니다' : 'By signing in, you agree to our Terms of Service'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="login-page-footer">
        <span>&copy; 2024 SessionCast. All rights reserved.</span>
      </div>
    </div>
  );
}
