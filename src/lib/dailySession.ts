/**
 * Sistema de Sesiones Diarias para puzzles del día
 * Cada día tiene su propio progreso independiente, incluso si repite el mismo puzzle
 */

import type { Puzzle } from '../types';

export interface DailySession {
  dateKey: string; // "YYYY-MM-DD"
  puzzleId: string; // ID del puzzle usado ese día
  progressId: string; // ID único para el progreso: "daily-YYYY-MM-DD"
}

const STORAGE_KEY = 'heptagramas_dailySessions';

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
 * Genera hash simple para seleccionar puzzle determinísticamente
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Selecciona el puzzle del día para una fecha específica
 * Filtra puzzles por rango de soluciones 80-150 para mejor experiencia
 */
export function getDailyPuzzleForDate(dateKey: string, puzzles: Puzzle[]): Puzzle {
  if (puzzles.length === 0) {
    throw new Error('No hay puzzles disponibles');
  }
  
  const hash = simpleHash(dateKey);
  
  // PREFERENCIA 1: Puzzles en rango óptimo 80-150 soluciones
  const optimalPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 80 && count <= 150;
  });
  
  if (optimalPuzzles.length > 0) {
    const index = hash % optimalPuzzles.length;
    return optimalPuzzles[index];
  }
  
  // FALLBACK 1: Rango ampliado 70-160 (si no hay en rango óptimo)
  const fallbackPuzzles = puzzles.filter(p => {
    const count = p.solutionCount;
    return count !== undefined && count >= 70 && count <= 160;
  });
  
  if (fallbackPuzzles.length > 0) {
    if (import.meta.env.DEV) {
      console.warn(
        `[DailyPuzzle] No hay puzzles en rango óptimo (80-150) para ${dateKey}. ` +
        `Usando rango ampliado (70-160). Puzzles disponibles: ${fallbackPuzzles.length}`
      );
    }
    const index = hash % fallbackPuzzles.length;
    return fallbackPuzzles[index];
  }
  
  // FALLBACK 2: Cualquier puzzle (último recurso)
  if (import.meta.env.DEV) {
    console.warn(
      `[DailyPuzzle] No hay puzzles en rangos óptimos para ${dateKey}. ` +
      `Usando cualquier puzzle disponible.`
    );
  }
  const index = hash % puzzles.length;
  return puzzles[index];
}

/**
 * Obtiene o crea la sesión diaria para una fecha
 */
export function getDailySession(dateKey: string, puzzles: Puzzle[]): DailySession {
  const sessions = loadAllDailySessions();
  
  // Si ya existe sesión para este día, retornarla
  if (sessions[dateKey]) {
    return sessions[dateKey];
  }
  
  // Crear nueva sesión
  const puzzle = getDailyPuzzleForDate(dateKey, puzzles);
  const newSession: DailySession = {
    dateKey,
    puzzleId: puzzle.id,
    progressId: `daily-${dateKey}`,
  };
  
  // Guardar
  sessions[dateKey] = newSession;
  saveDailySessions(sessions);
  
  return newSession;
}

/**
 * Carga todas las sesiones diarias del localStorage
 */
export function loadAllDailySessions(): Record<string, DailySession> {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * Guarda las sesiones diarias en localStorage
 */
function saveDailySessions(sessions: Record<string, DailySession>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error guardando sesiones diarias:', err);
  }
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
