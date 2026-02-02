import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { normalizeString } from './normalizeChar';

export interface DefinitionsDict {
  [word: string]: string;
}

export function useDefinitions() {
  const { language } = useLanguage();
  const [definitions, setDefinitions] = useState<DefinitionsDict>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefinitions = async () => {
      // No cargar definiciones en inglés
      if (language === 'en') {
        setDefinitions({});
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/heptagramas/definiciones_normalizado.txt');
        if (!response.ok) throw new Error('No se pudo cargar el archivo de definiciones');
        
        const text = await response.text();
        const defs: DefinitionsDict = {};
        
        // Parsear el archivo línea por línea
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            // Buscar el patrón: palabra^número seguido de espacios/tabs y la definición
            const match = line.match(/^(\S+?)(?:\^[\d])?\s+(.+)$/);
            if (match) {
              const word = match[1];
              const definition = match[2];
              // Normalizar la palabra con la misma lógica del juego
              const normalized = normalizeString(word, true);
              if (normalized) {
                defs[normalized] = definition.trim();
              }
            }
          }
        }
        
        setDefinitions(defs);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    };

    loadDefinitions();
  }, [language]);

  const getDefinition = (word: string): string | null => {
    return definitions[normalizeString(word, true)] || null;
  };

  return { definitions, loading, error, getDefinition };
}
