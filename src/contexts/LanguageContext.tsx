import { useEffect, useState, type ReactNode } from 'react';
import { clearProgressCache } from '../lib/storageAdapter';
import InitialLoadingScreen from '../components/InitialLoadingScreen';
import { LanguageContext, type Language } from './languageContextStore';

const translations: Record<Language, Record<string, string>> = {
  es: {},
};

const loadTranslations = async () => {
  const baseUrl = import.meta.env.BASE_URL;
  const esResponse = await fetch(`${baseUrl}i18n/es.json`);
  translations.es = await esResponse.json();
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('app-language', 'es');
    loadTranslations()
      .then(() => setIsLoaded(true))
      .catch((err) => {
        console.error('[LanguageProvider] Error cargando traducciones:', err);
        setIsLoaded(true);
      });
  }, []);

  const setLanguage = () => {
    localStorage.setItem('app-language', 'es');
    clearProgressCache();
  };

  const t = (key: string): string => {
    return translations.es[key] || key;
  };

  if (!isLoaded) {
    return <InitialLoadingScreen message="Preparando biblioteca y textos..." />;
  }

  return (
    <LanguageContext.Provider value={{ language: 'es', setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
