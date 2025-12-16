import { createContext, useContext, useState, ReactNode } from 'react';
import { Language, translations, TranslationKey } from './translations';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectLanguage(): Language {
  // Check URL parameter first (from landing page)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang === 'ko' || urlLang === 'en') {
    // Save to localStorage for future visits
    localStorage.setItem('lang', urlLang);
    // Clean up URL (remove lang param)
    urlParams.delete('lang');
    const newUrl = urlParams.toString()
      ? `${window.location.pathname}?${urlParams.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    return urlLang;
  }

  // Check localStorage
  const saved = localStorage.getItem('lang');
  if (saved === 'ko' || saved === 'en') {
    return saved;
  }

  // Default to English
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage);

  const setLang = (newLang: Language) => {
    localStorage.setItem('lang', newLang);
    setLangState(newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
