/**
 * Sistema de Sesiones Diarias para puzzles del día
 * Cada día tiene su propio progreso independiente, incluso si repite el mismo puzzle
 */

import type { Puzzle } from '../types';
import { getDailySessions, setDailySessions } from '../storage';

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

function getSessionKey(language: 'es' | 'en', dateKey: string): string {
  return `${language}-${dateKey}`;
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
 * Selecciona el puzzle del día para una fecha específica
 * Filtra puzzles por rango de soluciones 70-170 para mejor experiencia
 */
export function getDailyPuzzleForDate(dateKey: string, puzzles: Puzzle[]): Puzzle {
  if (puzzles.length === 0) {
    throw new Error('No hay puzzles disponibles');
  }
  
  const dayIndex = getDayIndex(dateKey);
  
  // PREFERENCIA 1: Puzzles en rango óptimo 70-170 soluciones
  const optimalPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 170;
  });
  
  if (optimalPuzzles.length > 0) {
    const index = dayIndex % optimalPuzzles.length;
    return optimalPuzzles[index];
  }
  
  // FALLBACK 1: Rango ampliado 70-200 (si no hay en rango óptimo)
  const fallbackPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 200;
  });
  
  if (fallbackPuzzles.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DailyPuzzle] No hay puzzles en rango óptimo (70-170) para ${dateKey}. ` +
        `Usando rango ampliado (70-200). Puzzles disponibles: ${fallbackPuzzles.length}`
      );
    }
    const index = dayIndex % fallbackPuzzles.length;
    return fallbackPuzzles[index];
  }
  
  // FALLBACK 2: Cualquier puzzle (último recurso)
  if (import.meta.env.DEV) {
    console.warn(
      `[DailyPuzzle] No hay puzzles en rangos óptimos para ${dateKey}. ` +
      `Usando cualquier puzzle disponible.`
    );
  }
  const index = dayIndex % puzzles.length;
  return puzzles[index];
}

/**
 * Obtiene o crea la sesión diaria para una fecha
 */
export function getDailySession(dateKey: string, puzzles: Puzzle[], language: 'es' | 'en' = 'es'): DailySession {
  const sessions = loadAllDailySessions();
  const sessionKey = getSessionKey(language, dateKey);
  
  // Si ya existe sesión para este día, retornarla
  if (sessions[sessionKey]) {
    return sessions[sessionKey];
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
