/**
 * Migración de localStorage a IndexedDB
 * Se ejecuta una sola vez al iniciar la app
 */

import type { PlayerState, PuzzleProgress } from '../types';
import {
  setPlayerState,
  setClassicProgress,
  setDailyProgress,
  setExoticsRunState,
  setDailySessions,
} from './api';
import type { ClassicProgress, DailyProgress } from './types';

const MIGRATION_FLAG_KEY = 'heptagramas_migrated_to_idb';

/**
 * Verifica si ya se migró
 */
function isMigrationDone(): boolean {
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * Marca la migración como completada
 */
function markMigrationDone(): void {
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

/**
 * Migra todos los datos de localStorage a IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  // Si ya migró, salir
  if (isMigrationDone()) {
    console.log('[Migration] Ya migrado, saltando...');
    return;
  }

  console.log('[Migration] Iniciando migración de localStorage a IndexedDB...');

  try {
    let migratedCount = 0;

    // 1. Migrar PlayerState
    const playerStateStr = localStorage.getItem('heptagramas_playerState');
    if (playerStateStr) {
      try {
        const playerState: PlayerState = JSON.parse(playerStateStr);
        if (!playerState.settings.activeFont) {
          playerState.settings.activeFont = 'classic';
        }
        await setPlayerState(playerState);
        migratedCount++;
        console.log('[Migration] ✓ PlayerState migrado');
      } catch (error) {
        console.error('[Migration] Error al migrar PlayerState:', error);
      }
    }

    // 2. Migrar ExoticsRunState
    const exoticsRunStr = localStorage.getItem('exoticsRunState');
    if (exoticsRunStr) {
      try {
        const exoticsRun = JSON.parse(exoticsRunStr);
        await setExoticsRunState(exoticsRun);
        migratedCount++;
        console.log('[Migration] ✓ ExoticsRunState migrado');
      } catch (error) {
        console.error('[Migration] Error al migrar ExoticsRunState:', error);
      }
    }

    // 3. Migrar DailySessions
    const dailySessionsStr = localStorage.getItem('heptagramas_dailySessions');
    if (dailySessionsStr) {
      try {
        const dailySessions = JSON.parse(dailySessionsStr);
        await setDailySessions(dailySessions);
        migratedCount++;
        console.log('[Migration] ✓ DailySessions migrado');
      } catch (error) {
        console.error('[Migration] Error al migrar DailySessions:', error);
      }
    }

    // 4. Migrar Progress by Puzzle ID (clásicos y diarios)
    const progressByIdStr = localStorage.getItem('heptagramas_progressByPuzzleId');
    if (progressByIdStr) {
      try {
        const progressById: Record<string, PuzzleProgress> = JSON.parse(progressByIdStr);
        
        for (const [id, progress] of Object.entries(progressById)) {
          // Detectar si es diario (tiene prefijo "daily-")
          if (id.startsWith('daily-')) {
            // Es un progreso diario
            const dateMatch = id.match(/^daily-(\d{4}-\d{2}-\d{2})$/);
            if (dateMatch) {
              const dailyProgress: DailyProgress = {
                date: dateMatch[1],
                foundWords: progress.foundWords || [],
                completed: false, // Calcular según totalWords si se tiene
                lastPlayedAt: progress.lastPlayedAt ? new Date(progress.lastPlayedAt).getTime() : Date.now(),
                totalWords: undefined,
                progressId: id,
              };
              await setDailyProgress(dailyProgress);
              migratedCount++;
            }
          } else {
            // Es un progreso clásico
            const classicProgress: ClassicProgress = {
              id: id,
              foundWords: progress.foundWords || [],
              completed: false,
              lastPlayedAt: progress.lastPlayedAt ? new Date(progress.lastPlayedAt).getTime() : Date.now(),
              score: progress.score,
              superHeptaWords: progress.superHeptaWords,
              startedAt: progress.startedAt ? new Date(progress.startedAt).getTime() : undefined,
            };
            await setClassicProgress(classicProgress);
            migratedCount++;
          }
        }
        
        console.log('[Migration] ✓ Progress migrado:', Object.keys(progressById).length, 'puzzles');
      } catch (error) {
        console.error('[Migration] Error al migrar Progress:', error);
      }
    }

    // Marcar migración como completada
    markMigrationDone();
    
    console.log(`[Migration] ✓ Migración completada: ${migratedCount} elementos migrados`);
    console.log('[Migration] Los datos en localStorage se mantienen como respaldo');
  } catch (error) {
    console.error('[Migration] Error durante la migración:', error);
    throw error;
  }
}

/**
 * Resetea el flag de migración (para testing)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
  console.log('[Migration] Flag de migración reseteado');
}
