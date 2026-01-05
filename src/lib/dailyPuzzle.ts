import type { Puzzle } from '../types';

// Algoritmo simple de hash para string
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Obtener fecha local en formato YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Seleccionar puzzle del día de forma determinística
// Filtra por rango óptimo 80-150 soluciones
export function getDailyPuzzle(puzzles: Puzzle[]): Puzzle {
  if (puzzles.length === 0) {
    throw new Error('No hay puzzles disponibles');
  }
  
  const today = getTodayString();
  const hash = simpleHash(today);
  
  // PREFERENCIA 1: Puzzles en rango óptimo 80-150 soluciones
  const optimalPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 80 && count <= 150;
  });
  
  if (optimalPuzzles.length > 0) {
    const index = hash % optimalPuzzles.length;
    return optimalPuzzles[index];
  }
  
  // FALLBACK 1: Rango ampliado 70-160
  const fallbackPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 160;
  });
  
  if (fallbackPuzzles.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DailyPuzzle] No hay puzzles en rango óptimo (80-150). ` +
        `Usando rango ampliado (70-160).`
      );
    }
    const index = hash % fallbackPuzzles.length;
    return fallbackPuzzles[index];
  }
  
  // FALLBACK 2: Cualquier puzzle
  if (import.meta.env.DEV) {
    console.warn(
      `[DailyPuzzle] No hay puzzles en rangos óptimos. ` +
      `Usando cualquier puzzle disponible.`
    );
  }
  const index = hash % puzzles.length;
  return puzzles[index];
}

// Obtener el ID del puzzle del día (útil para UI)
export function getDailyPuzzleId(puzzles: Puzzle[]): string {
  return getDailyPuzzle(puzzles).id;
}

// Verificar si un puzzle es el del día
export function isToday(puzzleId: string, puzzles: Puzzle[]): boolean {
  const dailyPuzzle = getDailyPuzzle(puzzles);
  return dailyPuzzle.id === puzzleId;
}
