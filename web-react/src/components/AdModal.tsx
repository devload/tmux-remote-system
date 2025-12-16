import { useState, useEffect, useCallback, useRef } from 'react';
import './AdModal.css';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdModal({ isOpen, onClose, onUpgrade }: AdModalProps) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);
  const adRef = useRef<HTMLModElement>(null);
  const adInitialized = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(5);
      setCanClose(false);
      adInitialized.current = false;
      return;
    }

    // Initialize AdSense when modal opens
    if (!adInitialized.current) {
      const timer = setTimeout(() => {
        try {
          if (window.adsbygoogle && adRef.current) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            adInitialized.current = true;
          }
        } catch (err) {
          console.error('AdSense modal error:', err);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleUpgrade = useCallback(() => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('/pricing', '_blank');
    }
  }, [onClose, onUpgrade]);

  if (!isOpen) return null;

  return (
    <div className="ad-modal-overlay">
      <div className="ad-modal">
        <div className="ad-modal-header">
          <span className="ad-modal-label">ADVERTISEMENT</span>
          {canClose ? (
            <button className="ad-modal-close" onClick={onClose}>
              Close ×
            </button>
          ) : (
            <span className="ad-modal-countdown">
              Skip in {countdown}s
            </span>
          )}
        </div>

        <div className="ad-modal-content">
          {/* AdSense Ad Unit for Modal */}
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minHeight: '250px', width: '100%' }}
            data-ad-client="ca-pub-1790975977903665"
            data-ad-slot="4798053532"
            data-ad-format="rectangle"
          />

          {/* Fallback upgrade prompt */}
          <div className="ad-modal-fallback">
            <div className="ad-modal-icon">⚡</div>
            <h2 className="ad-modal-title">Tired of Ads?</h2>
            <p className="ad-modal-subtitle">Upgrade to remove all ads</p>

            <ul className="ad-modal-features">
              <li>✓ No interruption ads</li>
              <li>✓ 5 concurrent sessions</li>
              <li>✓ Priority support</li>
            </ul>

            <button className="ad-modal-cta" onClick={handleUpgrade}>
              Upgrade for $5/mo
            </button>
          </div>

          <p className="ad-modal-note">
            Free users see this ad every 10 key inputs
          </p>
        </div>
      </div>
    </div>
  );
}
