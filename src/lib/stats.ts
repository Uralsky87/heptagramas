import { normalizeChar } from './normalizeChar';

/**
 * Calcula cuántas palabras de la lista de soluciones empiezan por cada letra.
 * @param solutions - Lista completa de palabras válidas (ya normalizadas)
 * @param letters - Lista de letras del puzzle (center + outer, ya normalizadas)
 * @returns Un objeto con cada letra como clave y el conteo como valor
 */
export function getStartLetterCounts(
  solutions: string[],
  letters: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Inicializar contadores para cada letra (normalizada)
  letters.forEach(letter => {
    const normalized = normalizeChar(letter.toLowerCase(), false);
    if (normalized) {
      counts[normalized] = 0;
    }
  });
  
  // Contar soluciones que empiezan por cada letra
  solutions.forEach(word => {
    if (word.length > 0) {
      const firstChar = word[0]; // Ya está normalizada desde solvePuzzle
      if (counts[firstChar] !== undefined) {
        counts[firstChar]++;
      }
    }
  });
  
  return counts;
}

/**
 * Calcula cuántas palabras de la lista de soluciones tienen 7 o más letras.
 * @param solutions - Lista completa de palabras válidas
 * @returns Cantidad de palabras de 7+ letras
 */
export function getLen7PlusCount(solutions: string[]): number {
  return solutions.filter(word => word.length >= 7).length;
}

/**
 * Calcula cuántas palabras encontradas por el usuario empiezan por cada letra.
 * @param foundWords - Palabras encontradas por el usuario (ya normalizadas)
 * @param solutionsSet - Set de todas las soluciones válidas (para validar)
 * @param letters - Lista de letras del puzzle (center + outer, ya normalizadas)
 * @returns Un objeto con cada letra como clave y el conteo de encontradas
 */
export function getStartLetterCountsFound(
  foundWords: string[],
  solutionsSet: Set<string>,
  letters: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  // Inicializar contadores para cada letra (normalizada)
  letters.forEach(letter => {
    const normalized = normalizeChar(letter.toLowerCase(), false);
    if (normalized) {
      counts[normalized] = 0;
    }
  });
  
  // Contar palabras encontradas que empiezan por cada letra
  foundWords.forEach(word => {
    if (word.length > 0 && solutionsSet.has(word)) {
      const firstChar = word[0];
      if (counts[firstChar] !== undefined) {
        counts[firstChar]++;
      }
    }
  });
  
  return counts;
}

/**
 * Calcula cuántas palabras encontradas de 7+ letras tiene el usuario.
 * @param foundWords - Palabras encontradas por el usuario (ya normalizadas)
 * @param solutionsSet - Set de todas las soluciones válidas (para validar)
 * @returns Cantidad de palabras encontradas de 7+ letras
 */
export function getLen7PlusCountFound(
  foundWords: string[],
  solutionsSet: Set<string>
): number {
  return foundWords.filter(word => 
    word.length >= 7 && solutionsSet.has(word)
  ).length;
}
