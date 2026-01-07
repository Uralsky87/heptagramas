import { solvePuzzle } from './solvePuzzle';
import type { DictionaryData } from './dictionary';
import type { ExoticPuzzle } from '../types';

const MIN_SOLUTIONS = 50;
const MAX_SOLUTIONS = 500;
const MAX_ATTEMPTS = 1000; // Número máximo de intentos antes de rendirse

// Letras problemáticas en español (generan pocas palabras)
const PROBLEMATIC_LETTERS = ['k', 'w', 'x', 'y'];

// Caché del último puzzle generado para evitar repeticiones inmediatas
let lastGeneratedPuzzle: { center: string; outer: string[] } | null = null;

/**
 * Valida si un set de letras cumple las reglas de calidad
 */
function isValidLetterSet(center: string, outer: string[]): boolean {
  // Regla 1: La letra central NO puede ser problemática
  if (PROBLEMATIC_LETTERS.includes(center)) {
    return false;
  }
  
  // Regla 2: Máximo 1 letra problemática en todo el set
  const allLetters = [center, ...outer];
  const problematicCount = allLetters.filter(l => PROBLEMATIC_LETTERS.includes(l)).length;
  if (problematicCount > 1) {
    return false;
  }
  
  // Regla 3 (opcional): Si el centro es 'q', debe haber 'u' en el set
  if (center === 'q' && !outer.includes('u')) {
    return false;
  }
  
  return true;
}

/**
 * Genera un set aleatorio de 7 letras (1 centro + 6 exteriores)
 * sin duplicados y sin ñ
 */
function generateRandomLetters(): { center: string; outer: string[] } {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split(''); // Sin ñ
  const selected: string[] = [];
  
  // Seleccionar 7 letras únicas al azar
  while (selected.length < 7) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    const letter = alphabet[randomIndex];
    
    if (!selected.includes(letter)) {
      selected.push(letter);
    }
  }
  
  // Mezclar para asignar aleatoriamente centro y exteriores
  const shuffled = selected.sort(() => Math.random() - 0.5);
  
  return {
    center: shuffled[0],
    outer: shuffled.slice(1),
  };
}

/**
 * Calcula el número de soluciones para un set de letras
 */
function calculateSolutions(
  center: string,
  outer: string[],
  dictionary: DictionaryData
): number {
  const solutions = solvePuzzle(
    center,
    outer,
    dictionary,
    3, // minLen
    false // allowEnye
  );
  
  return solutions.length;
}

/**
 * Genera un puzzle exótico válido (50-500 soluciones)
 * Reintenta automáticamente hasta encontrar uno válido
 * 
 * @returns Puzzle generado o null si no se pudo generar después de MAX_ATTEMPTS
 */
export async function generateExoticPuzzle(
  dictionary: DictionaryData,
  onProgress?: (attempt: number, lastSolutionCount: number) => void
): Promise<ExoticPuzzle | null> {
  console.log('[ExoticGenerator] Iniciando generación de puzzle...');
  console.log(`[ExoticGenerator] Rango objetivo: ${MIN_SOLUTIONS}-${MAX_SOLUTIONS} soluciones`);
  
  let attempts = 0;
  let lastSolutionCount = 0;
  
  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // Generar set aleatorio
    const { center, outer } = generateRandomLetters();
    
    // Validar reglas de calidad ANTES de calcular soluciones (optimización)
    if (!isValidLetterSet(center, outer)) {
      if (import.meta.env.DEV && attempts % 100 === 0) {
        console.log(
          `[ExoticGenerator] Intento ${attempts}: Descartado por letras problemáticas ` +
          `(${center} + [${outer.join(', ')}])`
        );
      }
      continue; // Saltar a siguiente intento
    }
    
    // Evitar repetir el puzzle anterior
    if (lastGeneratedPuzzle) {
      const sameCenter = center === lastGeneratedPuzzle.center;
      const sameOuter = outer.sort().join('') === lastGeneratedPuzzle.outer.sort().join('');
      if (sameCenter && sameOuter) {
        continue; // Saltar este intento, generar otro
      }
    }
    
    // Calcular soluciones
    const solutionCount = calculateSolutions(center, outer, dictionary);
    lastSolutionCount = solutionCount;
    
    // Log cada 50 intentos en desarrollo
    if (import.meta.env.DEV && attempts % 50 === 0) {
      console.log(
        `[ExoticGenerator] Intento ${attempts}: ` +
        `${center} + [${outer.join(', ')}] = ${solutionCount} soluciones`
      );
    }
    
    // Notificar progreso
    if (onProgress) {
      onProgress(attempts, solutionCount);
    }
    
    // Verificar si cumple el rango
    if (solutionCount >= MIN_SOLUTIONS && solutionCount <= MAX_SOLUTIONS) {
      const allLetters = [center, ...outer];
      const hasProblematic = allLetters.some(l => PROBLEMATIC_LETTERS.includes(l));
      const problematicList = allLetters.filter(l => PROBLEMATIC_LETTERS.includes(l));
      
      console.log(
        `[ExoticGenerator] ✓ Puzzle válido encontrado en intento ${attempts}!`,
        `\n  Centro: "${center}"`,
        `\n  Exteriores: [${outer.join(', ')}]`,
        `\n  Soluciones: ${solutionCount}`,
        hasProblematic ? `\n  ⚠️ Letras problemáticas: [${problematicList.join(', ')}]` : ''
      );
      
      // Guardar para evitar repeticiones
      lastGeneratedPuzzle = { center, outer };
      
      return {
        center,
        outer,
        allowExtraLetters: true,
      };
    }
    
    // Pequeña pausa cada 100 intentos para no bloquear el UI
    if (attempts % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // No se pudo generar un puzzle válido
  console.error(
    `[ExoticGenerator] ✗ No se pudo generar puzzle válido después de ${MAX_ATTEMPTS} intentos.`,
    `\nÚltimo intento tenía ${lastSolutionCount} soluciones.`
  );
  
  return null;
}

/**
 * Obtener información de diagnóstico sobre la generación
 */
export function getDiagnosticInfo(dictionary: DictionaryData): {
  totalWords: number;
  validRange: { min: number; max: number };
  samplePuzzle: { center: string; outer: string[]; solutions: number };
} {
  const { center, outer } = generateRandomLetters();
  const solutionCount = calculateSolutions(center, outer, dictionary);
  
  return {
    totalWords: dictionary.words.length,
    validRange: { min: MIN_SOLUTIONS, max: MAX_SOLUTIONS },
    samplePuzzle: { center, outer, solutions: solutionCount },
  };
}
