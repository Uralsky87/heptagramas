import type { DictionaryData } from './dictionary';
import { normalizeChar } from './normalizeChar';

// Caché de soluciones por puzzle
const solutionCache = new Map<string, string[]>();

/**
 * Calcula bitmask de un conjunto de letras (incluyendo ñ)
 */
function lettersMask(letters: string[]): number {
  let mask = 0;
  for (const letter of letters) {
    const code = letter.charCodeAt(0);
    if (code >= 97 && code <= 122) { // a-z
      mask |= 1 << (code - 97);
    } else if (letter === 'ñ') { // ñ -> bit 26
      mask |= 1 << 26;
    }
  }
  return mask;
}

/**
 * Genera clave de caché única para un puzzle
 * Incluye: center + outer ordenadas + minLen + exoticLetter opcional (NO USAR en Diario/Clásicos)
 */
function getCacheKey(center: string, outer: string[], minLen: number, exoticLetter?: string): string {
  const sorted = [...outer].sort().join('');
  const exotic = exoticLetter ? `:${exoticLetter}` : '';
  return `${center}:${sorted}:${minLen}${exotic}`;
}

/**
 * Resuelve un puzzle: encuentra todas las palabras válidas
 * que contienen la letra central y solo usan las letras permitidas.
 * 
 * Normaliza TODAS las letras usando normalizeChar para consistencia.
 * 
 * @param center - Letra central obligatoria
 * @param outer - Letras exteriores (6 letras)
 * @param dictionary - Diccionario preprocesado
 * @param minLen - Longitud mínima (default: 3)
 * @param allowEnye - Si permite ñ (default: true, ñ nunca puede ser letra central)
 * @param exoticLetter - Letra extra opcional para modo exótico (8 letras total). NO USAR en Diario/Clásicos.
 * @returns Array de palabras válidas (normalizadas)
 */
export function solvePuzzle(
  center: string,
  outer: string[],
  dictionary: DictionaryData,
  minLen: number = 3,
  allowEnye: boolean = true,
  exoticLetter?: string
): string[] {
  // Normalizar letras del puzzle
  const normalizedCenter = normalizeChar(center, allowEnye);
  const normalizedOuter = outer.map(l => normalizeChar(l, allowEnye));
  const normalizedExotic = exoticLetter ? normalizeChar(exoticLetter, allowEnye) : undefined;

  // Verificar caché
  const cacheKey = getCacheKey(normalizedCenter, normalizedOuter, minLen, normalizedExotic);
  if (solutionCache.has(cacheKey)) {
    return solutionCache.get(cacheKey)!;
  }

  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.log(
      `[solvePuzzle] Calculando soluciones:`,
      `\nCenter: "${normalizedCenter}"`,
      `\nOuter: [${normalizedOuter.join(', ')}]`,
      normalizedExotic ? `\nExotic: "${normalizedExotic}"` : '',
      `\nMinLen: ${minLen}`,
      `\nCacheKey: ${cacheKey}`
    );
  }

  // Calcular máscara de letras permitidas (incluir exótica si está presente)
  const allLetters = [normalizedCenter, ...normalizedOuter];
  if (normalizedExotic) {
    allLetters.push(normalizedExotic);
  }
  const allowedMask = lettersMask(allLetters);
  
  // Obtener índices de palabras que contienen la letra central
  const centerIndices = dictionary.byCenter.get(normalizedCenter) || [];
  
  const solutions: string[] = [];
  
  // Filtrar palabras
  for (const idx of centerIndices) {
    const word = dictionary.words[idx];
    const wordLen = dictionary.lens[idx];
    const wordMask = dictionary.masks[idx];
    
    // Verificar longitud mínima
    if (wordLen < minLen) {
      continue;
    }
    
    // Verificar que solo usa letras permitidas
    // Si (wordMask & ~allowedMask) === 0, entonces todas las letras están permitidas
    if ((wordMask & ~allowedMask) === 0) {
      solutions.push(word);
    }
  }
  
  // Log en desarrollo
  if (import.meta.env.DEV) {
    console.log(`[solvePuzzle] ✓ ${solutions.length} soluciones encontradas`);
  }

  // Guardar en caché
  solutionCache.set(cacheKey, solutions);
  
  return solutions;
}

/**
 * Limpia la caché de soluciones (útil si se recarga el diccionario)
 */
export function clearSolutionCache(): void {
  solutionCache.clear();
}
