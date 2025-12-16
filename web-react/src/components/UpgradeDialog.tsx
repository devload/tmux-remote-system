import { PlanLimitError } from '../types';
import './UpgradeDialog.css';

interface UpgradeDialogProps {
  error: PlanLimitError;
  lang: 'ko' | 'en';
  onClose: () => void;
}

export function UpgradeDialog({ error, lang, onClose }: UpgradeDialogProps) {
  const message = lang === 'ko' ? error.messageKo : error.messageEn;

  const handleUpgrade = () => {
    window.open(error.upgradeUrl, '_blank');
  };

  return (
    <div className="upgrade-dialog-overlay" onClick={onClose}>
      <div className="upgrade-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-dialog-close" onClick={onClose}>×</button>

        <div className="upgrade-dialog-icon">⚠️</div>

        <h2 className="upgrade-dialog-title">
          {lang === 'ko' ? '플랜 제한' : 'Plan Limit'}
        </h2>

        <p className="upgrade-dialog-message">{message}</p>

        <div className="upgrade-dialog-actions">
          <button className="upgrade-dialog-btn secondary" onClick={onClose}>
            {lang === 'ko' ? '닫기' : 'Close'}
          </button>
          <button className="upgrade-dialog-btn primary" onClick={handleUpgrade}>
            {lang === 'ko' ? 'Pro 업그레이드' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
    </div>
  );
}
