import { useEffect, useState } from 'react';
import { normalizeString } from './normalizeChar';

export interface DefinitionsDict {
  [word: string]: string;
}

let definitionsCache: DefinitionsDict | null = null;
let definitionsErrorCache: string | null = null;
let definitionsPromise: Promise<DefinitionsDict> | null = null;

async function fetchDefinitions(): Promise<DefinitionsDict> {
  const response = await fetch(`${import.meta.env.BASE_URL}definiciones_normalizado.txt`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el archivo de definiciones');
  }

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

  return defs;
}

function loadDefinitionsShared(): Promise<DefinitionsDict> {
  if (definitionsCache) {
    return Promise.resolve(definitionsCache);
  }

  if (definitionsErrorCache) {
    return Promise.reject(new Error(definitionsErrorCache));
  }

  if (!definitionsPromise) {
    definitionsPromise = fetchDefinitions()
      .then((definitions) => {
        definitionsCache = definitions;
        return definitions;
      })
      .catch((err: unknown) => {
        definitionsErrorCache = err instanceof Error ? err.message : 'Error desconocido';
        throw err;
      });
  }

  return definitionsPromise;
}

export function useDefinitions() {
  const [definitions, setDefinitions] = useState<DefinitionsDict>(definitionsCache ?? {});
  const [loading, setLoading] = useState(definitionsCache === null && definitionsErrorCache === null);
  const [error, setError] = useState<string | null>(definitionsErrorCache);

  useEffect(() => {
    if (definitionsCache) {
      return;
    }

    let isCancelled = false;

    loadDefinitionsShared()
      .then((defs) => {
        if (isCancelled) {
          return;
        }
        setDefinitions(defs);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (isCancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const getDefinition = (word: string): string | null => {
    return definitions[normalizeString(word, true)] || null;
  };

  return { definitions, loading, error, getDefinition };
}
