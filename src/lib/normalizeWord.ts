import { normalizeString } from './normalizeChar';

/**
 * Normaliza una palabra para validación consistente
 * Usa normalizeChar para asegurar misma lógica en todo el sistema
 * 
 * @deprecated Usa normalizeString directamente
 */
export function normalizeWord(word: string): string {
  // Por defecto, modo clásico NO permite ñ
  return normalizeString(word, false);
}
