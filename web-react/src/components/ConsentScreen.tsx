import { useState, useEffect } from 'react';
import './ConsentScreen.css';

const PLATFORM_API_URL = import.meta.env.VITE_PLATFORM_API_URL || import.meta.env.VITE_API_URL || '';
const LANDING_URL = import.meta.env.VITE_LANDING_URL || 'https://sessioncast.io';

interface ConsentScreenProps {
  authToken: string;
  userName?: string;
  onComplete: () => void;
  onLogout: () => void;
}

export function ConsentScreen({ authToken, userName, onComplete, onLogout }: ConsentScreenProps) {
  const [lang, setLang] = useState<'ko' | 'en'>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'ko' || saved === 'en') ? saved : 'ko';
  });
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const t = {
    ko: {
      welcome: '환영합니다!',
      welcomeMessage: '서비스 이용을 위해 아래 약관에 동의해 주세요.',
      termsLabel: '이용약관에 동의합니다',
      termsRequired: '(필수)',
      privacyLabel: '개인정보 처리방침에 동의합니다',
      privacyRequired: '(필수)',
      marketingLabel: '마케팅 정보 수신에 동의합니다',
      marketingOptional: '(선택)',
      marketingDesc: '새로운 기능, 업데이트, 프로모션 정보를 이메일로 받아보세요.',
      viewTerms: '약관 보기',
      viewPrivacy: '개인정보 처리방침 보기',
      continue: '계속하기',
      back: '로그아웃',
      agreementRequired: '필수 항목에 동의해 주세요.',
      errorOccurred: '오류가 발생했습니다. 다시 시도해 주세요.',
    },
    en: {
      welcome: 'Welcome!',
      welcomeMessage: 'Please agree to the following terms to use our service.',
      termsLabel: 'I agree to the Terms of Service',
      termsRequired: '(Required)',
      privacyLabel: 'I agree to the Privacy Policy',
      privacyRequired: '(Required)',
      marketingLabel: 'I agree to receive marketing communications',
      marketingOptional: '(Optional)',
      marketingDesc: 'Get emails about new features, updates, and promotions.',
      viewTerms: 'View Terms',
      viewPrivacy: 'View Privacy Policy',
      continue: 'Continue',
      back: 'Logout',
      agreementRequired: 'Please agree to the required terms.',
      errorOccurred: 'An error occurred. Please try again.',
    },
  };

  const text = t[lang];

  const handleSubmit = async () => {
    if (!termsAgreed || !privacyAgreed) {
      setError(text.agreementRequired);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Submitting consent to:', `${PLATFORM_API_URL}/api/users/me/consent`);
      const response = await fetch(`${PLATFORM_API_URL}/api/users/me/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          termsAgreed,
          privacyAgreed,
          marketingAgreed,
        }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        onComplete();
      } else {
        const errorText = await response.text();
        console.error('Consent API error:', response.status, errorText);
        setError(`${text.errorOccurred} (${response.status})`);
      }
    } catch (err) {
      console.error('Consent submission error:', err);
      setError(`${text.errorOccurred}: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const termsUrl = lang === 'ko' ? `${LANDING_URL}/ko/terms.html` : `${LANDING_URL}/terms.html`;
  const privacyUrl = lang === 'ko' ? `${LANDING_URL}/ko/privacy.html` : `${LANDING_URL}/privacy.html`;

  return (
    <div className="consent-screen">
      <div className="consent-container">
        <div className="consent-header">
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
        </div>

        <div className="consent-content">
          <div className="consent-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 9h10M7 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="19" cy="19" r="3" fill="currentColor"/>
            </svg>
          </div>

          <h1>{text.welcome}</h1>
          {userName && <p className="welcome-name">{userName}</p>}
          <p className="welcome-message">{text.welcomeMessage}</p>

          <div className="consent-form">
            <div className="consent-item">
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="consent-text">
                  {text.termsLabel}
                  <span className="required">{text.termsRequired}</span>
                </span>
              </label>
              <a
                href={termsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="consent-link"
              >
                {text.viewTerms}
              </a>
            </div>

            <div className="consent-item">
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="consent-text">
                  {text.privacyLabel}
                  <span className="required">{text.privacyRequired}</span>
                </span>
              </label>
              <a
                href={privacyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="consent-link"
              >
                {text.viewPrivacy}
              </a>
            </div>

            <div className="consent-item marketing">
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={marketingAgreed}
                  onChange={(e) => setMarketingAgreed(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="consent-text">
                  {text.marketingLabel}
                  <span className="optional">{text.marketingOptional}</span>
                </span>
              </label>
              <p className="marketing-desc">{text.marketingDesc}</p>
            </div>
          </div>

          {error && <p className="consent-error">{error}</p>}

          <div className="consent-actions">
            <button
              className="consent-btn primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !termsAgreed || !privacyAgreed}
            >
              {isSubmitting ? '...' : text.continue}
            </button>
            <button
              className="consent-btn secondary"
              onClick={onLogout}
              disabled={isSubmitting}
            >
              {text.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
