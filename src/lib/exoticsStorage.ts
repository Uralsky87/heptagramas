import type { ExoticsRunState } from '../types';
import { getExoticsRunState, setExoticsRunState } from '../storage';

/**
 * Cargar el estado de la run activa de exóticos (si existe)
 */
export function loadExoticsRun(): ExoticsRunState | null {
  // Usar cache sincrónico
  const cached = (window as any).__exoticsRunCache;
  if (cached !== undefined) {
    return cached;
  }
  return null;
}

/**
 * Precarga el estado de exóticos desde IndexedDB - ASYNC
 */
export async function preloadExoticsRun(): Promise<void> {
  try {
    const state = await getExoticsRunState();
    
    if (!state) {
      (window as any).__exoticsRunCache = null;
      return;
    }
    
    // Validación básica
    if (!state.runId || !state.puzzle || !Array.isArray(state.foundWords)) {
      console.warn('[ExoticsStorage] Estado corrupto, eliminando...');
      await clearExoticsRun();
      (window as any).__exoticsRunCache = null;
      return;
    }
    
    // Migración: Agregar campos nuevos si no existen
    if (!state.statsUnlocked) {
      state.statsUnlocked = { byStartLetter: false, lengthHint: false };
    } else {
      if (state.statsUnlocked.lengthHint === undefined) {
        state.statsUnlocked.lengthHint = false;
      }
    }
    
    if (!state.uiState) {
      state.uiState = { lengthHintExpanded: false, byStartLetterExpanded: true, runPanelMinimized: false };
    } else {
      if (state.uiState.runPanelMinimized === undefined) {
        state.uiState.runPanelMinimized = false;
      }
    }
    
    // Migración: foundWords -> foundWordsAll
    if (!state.foundWordsAll) {
      state.foundWordsAll = state.foundWords || [];
    }
    
    // Mantener foundWords por compatibilidad (será deprecated)
    if (!state.foundWords) {
      state.foundWords = state.foundWordsAll;
    }
    
    (window as any).__exoticsRunCache = state;
  } catch (error) {
    console.error('[ExoticsStorage] Error al cargar run:', error);
    await clearExoticsRun();
    (window as any).__exoticsRunCache = null;
  }
}

/**
 * Guardar el estado de la run activa
 */
export function saveExoticsRun(state: ExoticsRunState): void {
  // Actualizar cache
  (window as any).__exoticsRunCache = state;
  
  // Guardar async (fire and forget)
  setExoticsRunState(state).catch((error) => {
    console.error('[ExoticsStorage] Error al guardar run:', error);
  });
  
  if (import.meta.env.DEV) {
    console.log('[ExoticsStorage] Run guardada:', {
      runId: state.runId,
      extraLetters: state.extraLetters.length,
      foundWords: state.foundWords.length,
      scorePoints: state.scorePoints,
    });
  }
}

/**
 * Eliminar la run activa (terminar run)
 */
export async function clearExoticsRun(): Promise<void> {
  (window as any).__exoticsRunCache = null;
  
  try {
    await setExoticsRunState(null);
    
    if (import.meta.env.DEV) {
      console.log('[ExoticsStorage] Run eliminada');
    }
  } catch (error) {
    console.error('[ExoticsStorage] Error al eliminar run:', error);
  }
}

/**
 * Verificar si hay una run activa
 */
export function hasActiveRun(): boolean {
  return loadExoticsRun() !== null;
}

/**
 * Crear una nueva run de exóticos
 */
export function createNewRun(puzzle: ExoticsRunState['puzzle']): ExoticsRunState {
  const newRun: ExoticsRunState = {
    runId: generateRunId(),
    startedAt: new Date().toISOString(),
    puzzle,
    extraLetters: [],
    solutionsTotal: 0, // Se calculará cuando se añada la primera letra extra
    foundWords: [], // Deprecated - mantener por compatibilidad
    foundWordsAll: [],
    scorePoints: 0,
    xpEarned: 0,
    streak10Count: 0,
    milestones: {
      reached50Percent: false,
      reached100Found: false,
      claimed50PercentBonus: false,
    },
    doublePointsRemaining: 0,
    statsUnlocked: {
      byStartLetter: false,
      lengthHint: false,
    },
    uiState: {
      lengthHintExpanded: false,
      byStartLetterExpanded: true,
      runPanelMinimized: false,
    },
  };
  
  saveExoticsRun(newRun);
  
  if (import.meta.env.DEV) {
    console.log('[ExoticsStorage] Nueva run creada:', newRun.runId);
  }
  
  return newRun;
}

/**
 * Generar ID único para la run
 */
function generateRunId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `exotic-${timestamp}-${random}`;
}

/**
 * Actualizar las letras extra de la run activa
 */
export function updateExtraLetters(extraLetters: string[]): void {
  const run = loadExoticsRun();
  if (!run) {
    console.warn('[ExoticsStorage] No hay run activa para actualizar');
    return;
  }
  
  run.extraLetters = extraLetters;
  saveExoticsRun(run);
}

/**
 * Actualizar palabras encontradas
 */
export function updateFoundWords(foundWords: string[]): void {
  const run = loadExoticsRun();
  if (!run) {
    console.warn('[ExoticsStorage] No hay run activa para actualizar');
    return;
  }
  
  run.foundWords = foundWords;
  saveExoticsRun(run);
}

/**
 * Actualizar puntuación
 */
export function updateScore(scorePoints: number): void {
  const run = loadExoticsRun();
  if (!run) {
    console.warn('[ExoticsStorage] No hay run activa para actualizar');
    return;
  }
  
  run.scorePoints = scorePoints;
  saveExoticsRun(run);
}

/**
 * Actualizar milestone
 */
export function updateMilestone(milestone: keyof ExoticsRunState['milestones'], reached: boolean): void {
  const run = loadExoticsRun();
  if (!run) {
    console.warn('[ExoticsStorage] No hay run activa para actualizar');
    return;
  }
  
  run.milestones[milestone] = reached;
  saveExoticsRun(run);
}

/**
 * Actualizar estadísticas desbloqueadas
 */
export function updateStatsUnlocked(stat: keyof ExoticsRunState['statsUnlocked'], unlocked: boolean): void {
  const run = loadExoticsRun();
  if (!run) {
    console.warn('[ExoticsStorage] No hay run activa para actualizar');
    return;
  }
  
  run.statsUnlocked[stat] = unlocked;
  saveExoticsRun(run);
}
