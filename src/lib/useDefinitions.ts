import { useEffect, useState } from 'react';
import { normalizeString } from './normalizeChar';

export interface DefinitionsDict {
  [word: string]: string;
}

export function useDefinitions() {
  const [definitions, setDefinitions] = useState<DefinitionsDict>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}definiciones_normalizado.txt`);
        if (!response.ok) throw new Error('No se pudo cargar el archivo de definiciones');

        const text = await response.text();
        const defs: DefinitionsDict = {};

        const lines = text.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            const match = line.match(/^(\S+?)(?:\^[\d])?\s+(.+)$/);
            if (match) {
              const word = match[1];
              const definition = match[2];
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
  }, []);

  const getDefinition = (word: string): string | null => {
    return definitions[normalizeString(word, true)] || null;
  };

  return { definitions, loading, error, getDefinition };
}
