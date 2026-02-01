import React, { createContext, useState, useEffect } from 'react';
import { clearProgressCache } from '../lib/storageAdapter';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cargar traducciones
const translations: Record<Language, Record<string, string>> = {
  es: {},
  en: {}
};

// Cargar dinámicamente las traducciones
const loadTranslations = async () => {
  try {
    const esResponse = await fetch('/heptagramas/i18n/es.json');
    const enResponse = await fetch('/heptagramas/i18n/en.json');
    
    translations.es = await esResponse.json();
    translations.en = await enResponse.json();
  } catch (err) {
    console.error('[LanguageProvider] Error cargando traducciones:', err);
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Cargar idioma guardado o usar español por defecto
    const saved = localStorage.getItem('app-language') as Language | null;
    return saved || 'es';
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadTranslations().then(() => setIsLoaded(true));
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    // Limpiar caché de progreso para forzar recarga desde IndexedDB
    clearProgressCache();
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  if (!isLoaded) {
    return <div className="app"><header className="header"><h1>Loading...</h1></header></div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
}
