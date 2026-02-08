import type { Puzzle } from '../types';

// Convierte una fecha YYYY-MM-DD a indice de dia (UTC) para rotacion estable
function getDayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return Math.floor(utc / 86400000);
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
// Filtra por rango óptimo 70-170 soluciones
export function getDailyPuzzle(puzzles: Puzzle[]): Puzzle {
  if (puzzles.length === 0) {
    throw new Error('No hay puzzles disponibles');
  }
  
  const today = getTodayString();
  const dayIndex = getDayIndex(today);
  
  // PREFERENCIA 1: Puzzles en rango óptimo 70-170 soluciones
  const optimalPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 170;
  });
  
  if (optimalPuzzles.length > 0) {
    const index = dayIndex % optimalPuzzles.length;
    return optimalPuzzles[index];
  }
  
  // FALLBACK 1: Rango ampliado 70-200
  const fallbackPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 200;
  });
  
  if (fallbackPuzzles.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DailyPuzzle] No hay puzzles en rango óptimo (70-170). ` +
        `Usando rango ampliado (70-200).`
      );
    }
    const index = dayIndex % fallbackPuzzles.length;
    return fallbackPuzzles[index];
  }
  
  // FALLBACK 2: Cualquier puzzle
  if (import.meta.env.DEV) {
    console.warn(
      `[DailyPuzzle] No hay puzzles en rangos óptimos. ` +
      `Usando cualquier puzzle disponible.`
    );
  }
  const index = dayIndex % puzzles.length;
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
