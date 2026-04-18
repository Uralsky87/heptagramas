/**
 * Sistema de Sesiones Diarias para puzzles del día
 * Cada día tiene su propio progreso independiente, incluso si repite el mismo puzzle
 */

import type { Puzzle } from '../types';
import { getDailySessions, setDailySessions } from '../storage';
import {
  DAILY_FALLBACK_MIN_SOLUTIONS,
  DAILY_MAX_SOLUTIONS,
  DAILY_MIN_SOLUTIONS,
} from './puzzleRanges';

export interface DailySession {
  dateKey: string; // "YYYY-MM-DD"
  puzzleId: string; // ID del puzzle usado ese día
  progressId: string; // ID único para el progreso: "daily-<lang>-YYYY-MM-DD"
}

// Cache en memoria para acceso síncrono
let sessionsCache: Record<string, DailySession> | null = null;

/**
 * Precarga las sesiones diarias desde IndexedDB
 */
export async function preloadDailySessions(): Promise<void> {
  try {
    const sessions = await getDailySessions();
    sessionsCache = sessions || {};
  } catch (error) {
    console.error('[DailySession] Error al precargar sesiones:', error);
    sessionsCache = {};
  }
}

function getSessionKey(language: 'es', dateKey: string): string {
  return `${language}-${dateKey}`;
}

function getDailyPool(puzzles: Puzzle[]): Puzzle[] {
  const dailyPuzzles = puzzles.filter((puzzle) => puzzle.mode === 'daily');
  return dailyPuzzles.length > 0 ? dailyPuzzles : puzzles;
}

function getSelectableDailyPool(puzzles: Puzzle[]): Puzzle[] {
  const dailyPool = getDailyPool(puzzles);

  const optimalPuzzles = dailyPool.filter((puzzle) => {
    const count = puzzle.solutionCount;
    return count !== undefined && count >= DAILY_MIN_SOLUTIONS && count <= DAILY_MAX_SOLUTIONS;
  });

  if (optimalPuzzles.length > 0) {
    return optimalPuzzles;
  }

  const fallbackPuzzles = dailyPool.filter((puzzle) => {
    const count = puzzle.solutionCount;
    return count !== undefined && count >= DAILY_FALLBACK_MIN_SOLUTIONS;
  });

  if (fallbackPuzzles.length > 0) {
    return fallbackPuzzles;
  }

  return dailyPool;
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (hora local)
 */
export function getDailyKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte una fecha YYYY-MM-DD a indice de dia (UTC) para rotacion estable
 */
function getDayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = Date.UTC(year, month - 1, day);
  return Math.floor(utc / 86400000);
}

/**
 * Selecciona el puzzle del día para una fecha específica.
 * Filtra puzzles por rango objetivo de soluciones 120-350.
 */
export function getDailyPuzzleForDate(dateKey: string, puzzles: Puzzle[]): Puzzle {
  const dailyPool = getDailyPool(puzzles);
  const selectablePool = getSelectableDailyPool(puzzles);

  if (dailyPool.length === 0) {
    throw new Error('No hay puzzles disponibles');
  }
  
  const dayIndex = getDayIndex(dateKey);

  if (import.meta.env.DEV && selectablePool.length !== dailyPool.length) {
    console.warn(
      `[DailyPuzzle] Pool diario filtrado para ${dateKey}. ` +
      `Usando ${selectablePool.length}/${dailyPool.length} puzzles aptos segun solutionCount.`
    );
  }

  if (selectablePool.length > 0) {
    if (import.meta.env.DEV) {
      const hasOptimalPool = selectablePool.some((puzzle) => {
        const count = puzzle.solutionCount;
        return count !== undefined && count >= DAILY_MIN_SOLUTIONS && count <= DAILY_MAX_SOLUTIONS;
      });

      if (!hasOptimalPool) {
        console.warn(
          `[DailyPuzzle] No hay puzzles en rango objetivo (${DAILY_MIN_SOLUTIONS}-${DAILY_MAX_SOLUTIONS}) para ${dateKey}. ` +
          `Usando fallback >=${DAILY_FALLBACK_MIN_SOLUTIONS}. Puzzles disponibles: ${selectablePool.length}`
        );
      }
    }
    const index = dayIndex % selectablePool.length;
    return selectablePool[index];
  }
  
  // FALLBACK 2: Cualquier puzzle (último recurso)
  if (import.meta.env.DEV) {
    console.warn(
      `[DailyPuzzle] No hay puzzles en rangos óptimos para ${dateKey}. ` +
      `Usando cualquier puzzle disponible.`
    );
  }
  const index = dayIndex % dailyPool.length;
  return dailyPool[index];
}

/**
 * Obtiene o crea la sesión diaria para una fecha
 */
export function getDailySession(dateKey: string, puzzles: Puzzle[], language: 'es' = 'es'): DailySession {
  const sessions = loadAllDailySessions();
  const sessionKey = getSessionKey(language, dateKey);
  const allDailyPuzzles = getDailyPool(puzzles);
  
  // Si ya existe sesión para este día, retornarla
  if (sessions[sessionKey]) {
    const existingSession = sessions[sessionKey];
    const storedPuzzle = allDailyPuzzles.find((puzzle) => puzzle.id === existingSession.puzzleId);
    const fallbackPuzzle = storedPuzzle || getDailyPuzzleForDate(dateKey, puzzles);
    const normalizedSession: DailySession = {
      dateKey,
      puzzleId: fallbackPuzzle.id,
      progressId: existingSession.progressId || `daily-${language}-${dateKey}`,
    };

    if (
      existingSession.dateKey !== normalizedSession.dateKey ||
      existingSession.puzzleId !== normalizedSession.puzzleId ||
      existingSession.progressId !== normalizedSession.progressId
    ) {
      sessions[sessionKey] = normalizedSession;
      saveDailySessions(sessions);
    }

    return normalizedSession;
  }
  
  // Crear nueva sesión
  const puzzle = getDailyPuzzleForDate(dateKey, puzzles);
  const newSession: DailySession = {
    dateKey,
    puzzleId: puzzle.id,
    progressId: `daily-${language}-${dateKey}`,
  };
  
  // Guardar
  sessions[sessionKey] = newSession;
  saveDailySessions(sessions);
  
  return newSession;
}

/**
 * Resuelve el puzzle real asociado a una sesion diaria.
 * Prioriza el puzzleId guardado para mantener consistencia historica.
 */
export function getPuzzleForDailySession(session: Pick<DailySession, 'dateKey' | 'puzzleId'>, puzzles: Puzzle[]): Puzzle {
  const allDailyPuzzles = getDailyPool(puzzles);
  const storedPuzzle = allDailyPuzzles.find((puzzle) => puzzle.id === session.puzzleId);
  if (storedPuzzle) {
    return storedPuzzle;
  }

  if (import.meta.env.DEV) {
    console.warn(
      `[DailySession] Puzzle "${session.puzzleId}" no encontrado para ${session.dateKey}. ` +
      'Usando fallback por fecha.'
    );
  }

  return getDailyPuzzleForDate(session.dateKey, puzzles);
}

/**
 * Carga todas las sesiones diarias (sync - usa cache)
 */
export function loadAllDailySessions(): Record<string, DailySession> {
  if (sessionsCache === null) {
    console.warn('[DailySession] Sesiones no precargadas, retornando objeto vacío');
    return {};
  }
  return sessionsCache;
}

/**
 * Guarda las sesiones diarias (async)
 */
function saveDailySessions(sessions: Record<string, DailySession>): void {
  // Actualizar cache
  sessionsCache = sessions;
  
  // Guardar async (fire and forget)
  setDailySessions(sessions).catch((err) => {
    console.error('Error guardando sesiones diarias:', err);
  });
}

/**
 * Obtiene la lista de los últimos N días (incluyendo hoy)
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(getDailyKey(date));
  }
  
  return days;
}

/**
 * Formatea una fecha en formato legible
 * Ej: "2026-01-04" -> "Sábado 4 de enero"
 */
export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const today = getDailyKey();
  const yesterday = getDailyKey(new Date(Date.now() - 86400000));
  
  if (dateKey === today) {
    return 'Hoy';
  }
  if (dateKey === yesterday) {
    return 'Ayer';
  }
  
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  
  return `${dayName} ${day} de ${monthName}`;
}
