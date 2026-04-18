import { useContext } from 'react';
import { LanguageContext, type LanguageContextType } from './languageContextStore';

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }

  return context;
}
