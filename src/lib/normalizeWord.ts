import { normalizeString } from './normalizeChar';

/**
 * Normaliza una palabra para validación consistente
 * Usa normalizeChar para asegurar misma lógica en todo el sistema
 * 
 * @deprecated Usa normalizeString directamente
 */
export function normalizeWord(word: string): string {
  // Por defecto, permitir ñ en palabras
  return normalizeString(word, true);
}
