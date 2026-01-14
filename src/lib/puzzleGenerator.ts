import type { Puzzle } from '../types';
import type { DictionaryData } from './dictionary';
import { normalizeChar } from './normalizeChar';
import { isSuperHepta } from './validateWord';

/**
 * Genera el bitmask de letras permitidas para un puzzle
 */
function getPuzzleMask(center: string, outer: string[]): number {
  let mask = 0;
  const allLetters = [center, ...outer];
  
  for (const letter of allLetters) {
    const code = letter.charCodeAt(0);
    if (code >= 97 && code <= 122) {
      mask |= 1 << (code - 97);
    } else if (letter === 'ñ') {
      mask |= 1 << 26;
    }
  }
  
  return mask;
}

/**
 * Resuelve un puzzle y retorna las palabras válidas
 */
function solvePuzzleForGenerator(
  center: string,
  outer: string[],
  dictionary: DictionaryData,
  minLen: number = 3
): string[] {
  const centerIndices = dictionary.byCenter.get(center);
  if (!centerIndices) return [];

  const allowedMask = getPuzzleMask(center, outer);
  const solutions: string[] = [];

  for (const idx of centerIndices) {
    const word = dictionary.words[idx];
    const wordLen = dictionary.lens[idx];
    const wordMask = dictionary.masks[idx];

    // Filtros rápidos
    if (wordLen < minLen) continue;
    if ((wordMask & ~allowedMask) !== 0) continue;

    solutions.push(word);
  }

  return solutions;
}

/**
 * Verifica si un puzzle tiene al menos un SuperHepta
 */
function hasAtLeastOneSuperHepta(solutions: string[], center: string, outer: string[]): boolean {
  const puzzle: Puzzle = {
    id: 'temp',
    title: 'temp',
    center,
    outer,
    mode: 'classic',
    minLen: 3,
    allowEnye: true,
  };

  for (const word of solutions) {
    if (isSuperHepta(word, puzzle)) {
      return true;
    }
  }

  return false;
}

/**
 * Valida que un puzzle cumpla todos los criterios:
 * - 6 letras únicas en outer
 * - center no está en outer
 * - Entre minSolutions y maxSolutions soluciones
 * - Al menos 1 SuperHepta
 */
function isValidPuzzle(
  center: string,
  outer: string[],
  dictionary: DictionaryData,
  minSolutions: number = 100,
  maxSolutions: number = 300
): { valid: boolean; solutions?: string[]; reason?: string } {
  // Validar que outer tenga 6 letras únicas
  const outerSet = new Set(outer);
  if (outerSet.size !== 6) {
    return { valid: false, reason: 'outer debe tener 6 letras únicas' };
  }

  // Validar que center no esté en outer
  if (outerSet.has(center)) {
    return { valid: false, reason: 'center no puede estar en outer' };
  }

  // Calcular soluciones
  const solutions = solvePuzzleForGenerator(center, outer, dictionary, 3);

  // Validar rango de soluciones
  if (solutions.length < minSolutions) {
    return { valid: false, reason: `Solo ${solutions.length} soluciones (mín: ${minSolutions})` };
  }

  if (solutions.length > maxSolutions) {
    return { valid: false, reason: `${solutions.length} soluciones (máx: ${maxSolutions})` };
  }

  // Validar que tenga al menos 1 SuperHepta
  if (!hasAtLeastOneSuperHepta(solutions, center, outer)) {
    return { valid: false, reason: 'No tiene SuperHeptas' };
  }

  return { valid: true, solutions };
}

/**
 * Genera puzzles válidos aleatoriamente hasta obtener el número deseado
 */
export async function generateValidPuzzles(
  dictionary: DictionaryData,
  count: number = 22,
  minSolutions: number = 100,
  maxSolutions: number = 300,
  maxAttempts: number = 10000
): Promise<Puzzle[]> {
  const puzzles: Puzzle[] = [];
  const usedCombinations = new Set<string>();
  
  // Letras comunes en español (sin ñ para modo clásico)
  const commonLetters = 'aeosrnidlctumpbgvyqhfjzxkw'.split('');
  
  let attempts = 0;

  while (puzzles.length < count && attempts < maxAttempts) {
    attempts++;

    // Elegir letra central (preferir letras comunes)
    const centerIndex = Math.floor(Math.random() * Math.min(15, commonLetters.length));
    const center = commonLetters[centerIndex];

    // Elegir 6 letras exteriores únicas (que no incluyan center)
    const availableLetters = commonLetters.filter(l => l !== center);
    const shuffled = availableLetters.sort(() => Math.random() - 0.5);
    const outer = shuffled.slice(0, 6);

    // Normalizar todas las letras (permitir ñ en outer, pero center ya fue filtrado)
    const normalizedCenter = normalizeChar(center, true);
    const normalizedOuter = outer.map(l => normalizeChar(l, true));

    // Verificar que no se repita la combinación
    const combination = [normalizedCenter, ...normalizedOuter.sort()].join(',');
    if (usedCombinations.has(combination)) {
      continue;
    }

    // Validar puzzle
    const validation = isValidPuzzle(normalizedCenter, normalizedOuter, dictionary, minSolutions, maxSolutions);

    if (validation.valid && validation.solutions) {
      usedCombinations.add(combination);
      
      const puzzleId = `puzzle-${String(puzzles.length + 1).padStart(3, '0')}`;
      
      puzzles.push({
        id: puzzleId,
        title: `Puzzle ${puzzles.length + 1}: ${validation.solutions.length} palabras`,
        center: normalizedCenter,
        outer: normalizedOuter,
        mode: 'classic',
        minLen: 3,
        allowEnye: true,
      });

      console.log(`✓ Puzzle ${puzzles.length}/${count} generado (${validation.solutions.length} soluciones, intento ${attempts})`);
    } else if (attempts % 100 === 0) {
      console.log(`Intento ${attempts}/${maxAttempts}: ${puzzles.length}/${count} puzzles generados`);
    }
  }

  if (puzzles.length < count) {
    console.warn(`Solo se generaron ${puzzles.length}/${count} puzzles válidos en ${attempts} intentos`);
  }

  return puzzles;
}

/**
 * Función de test: imprime ejemplos de palabras válidas de un puzzle
 */
export function testPuzzle(puzzle: Puzzle, dictionary: DictionaryData, count: number = 10): void {
  console.log(`\n=== TEST PUZZLE: ${puzzle.title} ===`);
  console.log(`Centro: ${puzzle.center.toUpperCase()}`);
  console.log(`Exteriores: ${puzzle.outer.map(l => l.toUpperCase()).join(', ')}`);
  
  const solutions = solvePuzzleForGenerator(puzzle.center, puzzle.outer, dictionary, puzzle.minLen || 3);
  
  console.log(`\nTotal soluciones: ${solutions.length}`);
  
  if (solutions.length === 0) {
    console.log('❌ No hay soluciones para este puzzle');
    return;
  }

  // Mostrar primeras 'count' soluciones
  console.log(`\nPrimeras ${Math.min(count, solutions.length)} palabras válidas:`);
  solutions.slice(0, count).forEach((word, i) => {
    const isSH = isSuperHepta(word, puzzle);
    console.log(`  ${i + 1}. ${word}${isSH ? ' ⭐ (SuperHepta)' : ''}`);
  });

  // Contar SuperHeptas
  const superHeptas = solutions.filter(w => isSuperHepta(w, puzzle));
  console.log(`\nSuperHeptas encontrados: ${superHeptas.length}`);
  if (superHeptas.length > 0) {
    console.log('Ejemplos:', superHeptas.slice(0, 5).join(', '));
  }
}
