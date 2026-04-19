import type { Puzzle, ValidationResult } from '../types';
import { normalizeChar, normalizeString } from './normalizeChar';

/**
 * Detecta si una palabra usa TODAS las letras del puzzle
 * (center + outer) al menos una vez cada una.
 */
export function isSuperHepta(word: string, puzzle: Puzzle): boolean {
  const allowEnye = puzzle.allowEnye ?? true;
  const normalized = normalizeString(word, allowEnye);

  const normalizedCenter = normalizeChar(puzzle.center, allowEnye);
  const normalizedOuter = puzzle.outer.map((letter) => normalizeChar(letter, allowEnye));
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
 * y no esta ya encontrada.
 * @param solutions - Array de soluciones validas (debe venir de solvePuzzle)
 * @param exoticLetter - Letra extra opcional para modo exotico (NO USAR en Diario/Clasicos)
 */
export function validateWord(
  word: string,
  puzzle: Puzzle,
  foundWords: string[],
  solutions?: string[],
  exoticLetter?: string | null
): ValidationResult {
  const allowEnye = puzzle.allowEnye ?? true;
  const normalized = normalizeString(word, allowEnye);

  if (import.meta.env.DEV) {
    console.log(
      '[validateWord] Validando:',
      `\nOriginal: "${word}"`,
      `\nNormalizada: "${normalized}"`,
      `\nAllowEnye: ${allowEnye}`,
      exoticLetter ? `\nExotic: "${exoticLetter}"` : ''
    );
  }

  const minLen = puzzle.minLen || 3;
  if (normalized.length < minLen) {
    return { ok: false, code: 'too-short', reason: `Minimo ${minLen} letras.` };
  }

  const normalizedCenter = normalizeChar(puzzle.center, allowEnye);
  const normalizedOuter = puzzle.outer.map((letter) => normalizeChar(letter, allowEnye));
  const normalizedExotic = exoticLetter ? normalizeChar(exoticLetter, allowEnye) : null;

  if (!normalized.includes(normalizedCenter)) {
    return {
      ok: false,
      code: 'missing-central',
      reason: `Debe contener la letra central: "${normalizedCenter.toUpperCase()}".`,
    };
  }

  const allowedSet = new Set([normalizedCenter, ...normalizedOuter]);
  if (normalizedExotic) {
    allowedSet.add(normalizedExotic);
  }

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    if (!allowedSet.has(ch)) {
      if (import.meta.env.DEV) {
        console.warn(
          '[validateWord] Letra NO permitida detectada:',
          `\nCaracter: "${ch}"`,
          `\nCodigo Unicode: ${ch.charCodeAt(0)}`,
          `\nPosicion: ${i}`,
          `\nPalabra completa: "${normalized}"`,
          `\nPalabra original: "${word}"`,
          '\nLetras permitidas:',
          Array.from(allowedSet),
          `\nAllowEnye: ${allowEnye}`
        );
      }
      return { ok: false, code: 'invalid-letters', reason: 'Solo puedes usar las letras del heptagrama.' };
    }
  }

  const validSolutions = solutions || [];
  const solutionsSet = new Set(validSolutions);

  if (!solutionsSet.has(normalized)) {
    if (import.meta.env.DEV) {
      console.log(
        '[validateWord] Palabra no en diccionario:',
        `\n"${normalized}" no esta en las ${validSolutions.length} soluciones`
      );
    }
    return { ok: false, code: 'not-in-puzzle-dict', reason: 'No esta en el diccionario de este puzzle.' };
  }

  if (foundWords.includes(normalized)) {
    return { ok: false, code: 'already-found', reason: 'Ya la encontraste.' };
  }

  if (import.meta.env.DEV) {
    console.log(`[validateWord] Palabra valida: "${normalized}"`);
  }

  return { ok: true };
}
