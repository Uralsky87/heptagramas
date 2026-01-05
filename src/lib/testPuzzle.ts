/**
 * Función de test para puzzles desde la consola del navegador
 * 
 * Uso en consola del navegador:
 * 
 * import { testPuzzleInBrowser } from './lib/testPuzzle';
 * await testPuzzleInBrowser('puzzle-001');
 * 
 * O si tienes el puzzle cargado:
 * await testPuzzleInBrowser();  // Usa el puzzle actual
 */

import type { Puzzle } from '../types';
import { loadDictionary } from './dictionary';
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
export function solvePuzzle(
  center: string,
  outer: string[],
  dictionary: { words: string[], masks: number[], lens: number[], byCenter: Map<string, number[]> },
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
 * Test de puzzle desde el navegador
 */
export async function testPuzzleInBrowser(puzzleId?: string): Promise<void> {
  try {
    // Cargar puzzles
    const puzzlesModule = await import('../data/puzzles.json');
    const puzzles = puzzlesModule.default as Puzzle[];
    
    // Seleccionar puzzle
    let puzzle: Puzzle | undefined;
    
    if (puzzleId) {
      puzzle = puzzles.find(p => p.id === puzzleId);
      if (!puzzle) {
        console.error(`❌ Puzzle "${puzzleId}" no encontrado`);
        console.log('Puzzles disponibles:', puzzles.map(p => p.id).join(', '));
        return;
      }
    } else {
      // Usar el primero si no se especifica
      puzzle = puzzles[0];
    }
    
    console.log(`\n=== TEST PUZZLE: ${puzzle.title} ===`);
    console.log(`ID: ${puzzle.id}`);
    console.log(`Centro: ${puzzle.center.toUpperCase()}`);
    console.log(`Exteriores: ${puzzle.outer.map(l => l.toUpperCase()).join(', ')}`);
    
    // Cargar diccionario
    console.log('\nCargando diccionario...');
    const dictionary = await loadDictionary();
    
    // Resolver puzzle
    const solutions = solvePuzzle(
      puzzle.center,
      puzzle.outer,
      dictionary,
      puzzle.minLen || 3
    );
    
    console.log(`\n✓ Total soluciones: ${solutions.length}`);
    
    if (solutions.length === 0) {
      console.log('❌ No hay soluciones para este puzzle');
      return;
    }

    // Mostrar primeras 10 soluciones
    console.log(`\nPrimeras 10 palabras válidas:`);
    solutions.slice(0, 10).forEach((word, i) => {
      const isSH = isSuperHepta(word, puzzle);
      console.log(`  ${i + 1}. ${word}${isSH ? ' ⭐ (SuperHepta)' : ''}`);
    });

    // Contar SuperHeptas
    const superHeptas = solutions.filter(w => isSuperHepta(w, puzzle));
    console.log(`\n⭐ SuperHeptas encontrados: ${superHeptas.length}`);
    if (superHeptas.length > 0) {
      console.log('Ejemplos:', superHeptas.slice(0, 5).join(', '));
    }
    
    // Estadísticas adicionales
    console.log(`\nEstadísticas:`);
    console.log(`  - Palabras totales: ${solutions.length}`);
    console.log(`  - SuperHeptas: ${superHeptas.length}`);
    console.log(`  - Palabra más corta: ${solutions.reduce((min, w) => w.length < min.length ? w : min, solutions[0])}`);
    console.log(`  - Palabra más larga: ${solutions.reduce((max, w) => w.length > max.length ? w : max, solutions[0])}`);
    
  } catch (error) {
    console.error('Error en test:', error);
  }
}

// Exportar para usar en consola del navegador
if (typeof window !== 'undefined') {
  (window as any).testPuzzle = testPuzzleInBrowser;
  console.log('💡 Función testPuzzle() disponible en consola');
  console.log('   Uso: testPuzzle("puzzle-001")');
}
