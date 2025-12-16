import { useEffect, useRef, useState } from 'react';
import './AdBanner.css';

interface AdBannerProps {
  position?: 'sidebar' | 'bottom';
  onUpgrade?: () => void;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdBanner({ position = 'sidebar', onUpgrade }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (err) {
        console.error('AdSense error:', err);
        setAdError(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.open('/pricing', '_blank');
    }
  };

  return (
    <div className={`ad-banner ad-banner-${position}`}>
      <div className="ad-label">AD</div>
      <button
        className="ad-close"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(false);
          // Re-show after 5 minutes
          setTimeout(() => setIsVisible(true), 5 * 60 * 1000);
        }}
        aria-label="Close ad"
      >
        ×
      </button>
      <div className="ad-content">
        {/* AdSense Ad Unit */}
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '100px' }}
          data-ad-client="ca-pub-1790975977903665"
          data-ad-slot="4798053532"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        {/* Fallback when AdSense not loaded */}
        {adError && (
          <div className="ad-fallback" onClick={handleUpgradeClick}>
            <div className="ad-title">Upgrade to Remove Ads</div>
            <div className="ad-description">Get unlimited sessions & features</div>
            <button className="ad-cta">Upgrade Now</button>
          </div>
        )}
      </div>
    </div>
  );
}
