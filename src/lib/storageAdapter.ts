/**
 * Capa de compatibilidad - Adaptador entre la API antigua (localStorage) y la nueva (IndexedDB)
 * Mantiene la misma interfaz pero usa IndexedDB por detrás
 * 
 * NOTA: Este adaptador usa un sistema de cache en memoria para mantener compatibilidad
 * con código síncrono existente. Las escrituras son async y se encolan.
 */

import type { PuzzleProgress, PlayerState } from '../types';
import {
  setPlayerState as setPlayerStateDB,
  getClassicProgress,
  setClassicProgress,
  getDailyProgress,
  setDailyProgress,
} from '../storage';
import type { ClassicProgress, DailyProgress } from '../storage/types';

// Type alias para mantener compatibilidad
export type ProgressByPuzzleId = Record<string, PuzzleProgress>;

// Cache en memoria
const progressCache = new Map<string, PuzzleProgress>();
let writeQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

/**
 * Procesa la cola de escrituras
 */
async function processWriteQueue() {
  if (isProcessingQueue || writeQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (writeQueue.length > 0) {
    const write = writeQueue.shift();
    if (write) {
      try {
        await write();
      } catch (error) {
        console.error('[StorageAdapter] Error en escritura:', error);
      }
    }
  }
  
  isProcessingQueue = false;
}

/**
 * Añade una escritura a la cola
 */
function enqueueWrite(writeFn: () => Promise<void>) {
  writeQueue.push(writeFn);
  processWriteQueue();
}

// ========================================
// Progress by Puzzle ID (compatibilidad)
// ========================================

/**
 * Carga el progreso de un puzzle (clásico o diario) - SYNC
 * Usa cache en memoria para respuesta inmediata
 */
export function loadPuzzleProgress(puzzleId: string): PuzzleProgress | null {
  return progressCache.get(puzzleId) || null;
}

/**
 * Guarda el progreso de un puzzle (clásico o diario) - SYNC
 * Actualiza cache y encola escritura async
 */
export function savePuzzleProgress(puzzleId: string, progress: PuzzleProgress): void {
  // Actualizar cache inmediatamente
  progressCache.set(puzzleId, progress);
  
  // Encolar escritura async
  enqueueWrite(async () => {
    try {
      // Detectar si es diario
      if (puzzleId.startsWith('daily-')) {
        const dateMatch = puzzleId.match(/^daily-(\d{4}-\d{2}-\d{2})$/);
        if (dateMatch) {
          const daily: DailyProgress = {
            date: dateMatch[1],
            foundWords: progress.foundWords,
            completed: false,
            lastPlayedAt: new Date(progress.lastPlayedAt).getTime(),
            progressId: puzzleId,
          };
          await setDailyProgress(daily);
          return;
        }
      }
      
      // Es clásico
      const classic: ClassicProgress = {
        id: puzzleId,
        foundWords: progress.foundWords,
        completed: false,
        lastPlayedAt: new Date(progress.lastPlayedAt).getTime(),
        score: progress.score,
        superHeptaWords: progress.superHeptaWords,
        startedAt: progress.startedAt ? new Date(progress.startedAt).getTime() : undefined,
      };
      await setClassicProgress(classic);
    } catch (error) {
      console.error('[StorageAdapter] Error al guardar progreso:', error);
    }
  });
}

/**
 * Precarga el progreso de un puzzle en el cache - ASYNC
 */
export async function preloadPuzzleProgress(puzzleId: string): Promise<void> {
  try {
    // Detectar si es diario
    if (puzzleId.startsWith('daily-')) {
      const dateMatch = puzzleId.match(/^daily-(\d{4}-\d{2}-\d{2})$/);
      if (dateMatch) {
        const daily = await getDailyProgress(dateMatch[1]);
        if (daily) {
          const progress: PuzzleProgress = {
            foundWords: daily.foundWords,
            score: 0,
            superHeptaWords: [],
            startedAt: new Date(daily.lastPlayedAt).toISOString(),
            lastPlayedAt: new Date(daily.lastPlayedAt).toISOString(),
          };
          progressCache.set(puzzleId, progress);
        }
        return;
      }
    }
    
    // Es clásico
    const classic = await getClassicProgress(puzzleId);
    if (classic) {
      const progress: PuzzleProgress = {
        foundWords: classic.foundWords,
        score: classic.score || 0,
        superHeptaWords: classic.superHeptaWords || [],
        startedAt: classic.startedAt ? new Date(classic.startedAt).toISOString() : new Date(classic.lastPlayedAt).toISOString(),
        lastPlayedAt: new Date(classic.lastPlayedAt).toISOString(),
      };
      progressCache.set(puzzleId, progress);
    }
  } catch (error) {
    console.error('[StorageAdapter] Error al precargar progreso:', error);
  }
}

/**
 * Carga todos los progresos (para compatibilidad)
 * NOTA: Esta función es lenta, usar con cuidado
 */
export async function loadAllProgress(): Promise<ProgressByPuzzleId> {
  console.warn('[StorageAdapter] loadAllProgress() es lento con IndexedDB, considerar usar listClassicProgress()');
  
  // Por ahora retornar vacío, las funciones que la usen deberían migrar a la nueva API
  return {};
}

// ========================================
// Player State
// ========================================

/**
 * Carga el estado del jugador (SYNC - usa cache interno)
 */
export function loadPlayerState(): PlayerState {
  // Esta función se llama de forma síncrona, por lo que necesitamos un cache
  const cached = (window as any).__playerStateCache;
  if (cached) {
    return cached;
  }
  
  // Si no hay cache, retornar default
  return getDefaultPlayerState();
}

/**
 * Guarda el estado del jugador (ASYNC)
 */
export async function savePlayerState(state: PlayerState): Promise<void> {
  try {
    await setPlayerStateDB(state);
    // Actualizar cache
    (window as any).__playerStateCache = state;
  } catch (err) {
    console.error('Error guardando estado del jugador:', err);
  }
}

/**
 * Añade XP al jugador y actualiza el nivel automáticamente
 */
export async function addXP(xpAmount: number): Promise<PlayerState> {
  const state = loadPlayerState();
  state.xpTotal += xpAmount;
  
  await savePlayerState(state);
  return state;
}

/**
 * Actualiza el nivel del jugador
 */
export async function updateLevel(newLevel: number): Promise<void> {
  const state = loadPlayerState();
  state.level = newLevel;
  await savePlayerState(state);
}

function getDefaultPlayerState(): PlayerState {
  return {
    xpTotal: 0,
    level: 1,
    cosmeticsUnlocked: [],
    settings: {
      soundEnabled: true,
      activeTheme: 'default',
    },
  };
}

// ========================================
// Active Puzzle ID (mantener en memoria/cache por ahora)
// ========================================

let activePuzzleIdCache: string | null = null;

export function saveActivePuzzleId(puzzleId: string): void {
  activePuzzleIdCache = puzzleId;
}

export function loadActivePuzzleId(): string | null {
  return activePuzzleIdCache;
}

// ========================================
// Funciones de compatibilidad (deprecated)
// ========================================

/** @deprecated Use loadActivePuzzleId() */
export function loadCurrentPuzzleId(): string | null {
  return loadActivePuzzleId();
}

/** @deprecated Use saveActivePuzzleId() */
export function saveCurrentPuzzleId(puzzleId: string): void {
  saveActivePuzzleId(puzzleId);
}

/** @deprecated Use loadPlayerState() */
export function loadSettings() {
  const playerState = loadPlayerState();
  return playerState.settings;
}

/** @deprecated Use savePlayerState() */
export async function saveSettings(settings: { soundEnabled: boolean }): Promise<void> {
  const playerState = loadPlayerState();
  playerState.settings.soundEnabled = settings.soundEnabled;
  if (!playerState.settings.activeTheme) {
    playerState.settings.activeTheme = 'default';
  }
  await savePlayerState(playerState);
}

// ========================================
// Utilidades
// ========================================

export async function clearAllData(): Promise<void> {
  const { clearAllData: clearDB } = await import('../storage');
  await clearDB();
  activePuzzleIdCache = null;
  (window as any).__playerStateCache = null;
}
