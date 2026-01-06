import type { Puzzle, ValidationResult } from '../types';
import { normalizeString, normalizeChar } from './normalizeChar';

/**
 * Detecta si una palabra usa TODAS las letras del puzzle
 * (center + outer) al menos una vez cada una.
 */
export function isSuperHepta(word: string, puzzle: Puzzle): boolean {
  const allowEnye = puzzle.allowEnye || false;
  const normalized = normalizeString(word, allowEnye);
  
  // Normalizar letras del puzzle
  const normalizedCenter = normalizeChar(puzzle.center, allowEnye);
  const normalizedOuter = puzzle.outer.map(l => normalizeChar(l, allowEnye));
  const allLetters = [normalizedCenter, ...normalizedOuter];
  
  for (const letter of allLetters) {
    if (!normalized.includes(letter)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Valida si una palabra es correcta para el puzzle dado
 * y no está ya encontrada.
 * @param solutions - Array de soluciones válidas (debe venir de solvePuzzle)
 * @param exoticLetter - Letra extra opcional para modo exótico (NO USAR en Diario/Clásicos)
 */
export function validateWord(
  word: string,
  puzzle: Puzzle,
  foundWords: string[],
  solutions?: string[],
  exoticLetter?: string | null
): ValidationResult {
  const allowEnye = puzzle.allowEnye || false;
  const normalized = normalizeString(word, allowEnye);

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.log(
      `[validateWord] Validando:`,
      `\nOriginal: "${word}"`,
      `\nNormalizada: "${normalized}"`,
      `\nAllowEnye: ${allowEnye}`,
      exoticLetter ? `\nExotic: "${exoticLetter}"` : ''
    );
  }

  // 1. Longitud mínima
  const minLen = puzzle.minLen || 3;
  if (normalized.length < minLen) {
    return { ok: false, reason: `Mínimo ${minLen} letras.` };
  }

  // 2. Normalizar letras del puzzle para comparación consistente
  const normalizedCenter = normalizeChar(puzzle.center, allowEnye);
  const normalizedOuter = puzzle.outer.map(l => normalizeChar(l, allowEnye));
  const normalizedExotic = exoticLetter ? normalizeChar(exoticLetter, allowEnye) : null;

  // 3. Debe contener la letra central
  if (!normalized.includes(normalizedCenter)) {
    return {
      ok: false,
      reason: `Debe contener la letra central: "${normalizedCenter.toUpperCase()}".`,
    };
  }

  // 4. Solo puede usar letras permitidas (centro + exteriores + exótica)
  const allowedSet = new Set([normalizedCenter, ...normalizedOuter]);
  if (normalizedExotic) {
    allowedSet.add(normalizedExotic);
  }
  
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (!allowedSet.has(ch)) {
      // Log detallado en desarrollo para debugging
      if (import.meta.env.DEV) {
        console.warn(
          `[validateWord] ❌ Letra NO permitida detectada:`,
          `\nCarácter: "${ch}"`,
          `\nCódigo Unicode: ${ch.charCodeAt(0)}`,
          `\nPosición: ${i}`,
          `\nPalabra completa: "${normalized}"`,
          `\nPalabra original: "${word}"`,
          `\nLetras permitidas:`, Array.from(allowedSet),
          `\nAllowEnye: ${allowEnye}`
        );
      }
      return { ok: false, reason: 'Solo puedes usar las letras del heptagrama.' };
    }
  }

  // 5. Debe existir en las soluciones del puzzle (usando Set para O(1))
  const validSolutions = solutions || [];
  const solutionsSet = new Set(validSolutions);
  
  if (!solutionsSet.has(normalized)) {
    if (import.meta.env.DEV) {
      console.log(
        `[validateWord] Palabra no en diccionario:`,
        `\n"${normalized}" no está en las ${validSolutions.length} soluciones`
      );
    }
    return { ok: false, reason: 'No está en el diccionario de este puzzle.' };
  }

  // 6. No puede estar repetida
  if (foundWords.includes(normalized)) {
    return { ok: false, reason: 'Ya la encontraste.' };
  }

  if (import.meta.env.DEV) {
    console.log(`[validateWord] ✓ Palabra válida: "${normalized}"`);
  }

  return { ok: true };
}
