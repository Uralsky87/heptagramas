import type { PuzzleProgress, PlayerState, GameState } from '../types';

const STORAGE_KEYS = {
  ACTIVE_PUZZLE_ID: 'heptagramas_activePuzzleId',
  PROGRESS_BY_PUZZLE_ID: 'heptagramas_progressByPuzzleId',
  PLAYER_STATE: 'heptagramas_playerState',
  // Legacy keys para migración
  LEGACY_GAME_STATE: 'heptagramas_gameState',
  LEGACY_PROGRESS: 'heptagramas_progressByPuzzle',
  LEGACY_CURRENT_PUZZLE: 'heptagramas_currentPuzzleId',
  LEGACY_SETTINGS: 'heptagramas_settings',
};

export type ProgressByPuzzleId = Record<string, PuzzleProgress>;

let migrationDone = false;

// ========================================
// Migración de datos antiguos
// ========================================

function migrateOldData(): void {
  if (migrationDone) return;
  
  try {
    // Migrar progressByPuzzle -> progressByPuzzleId
    const oldProgress = localStorage.getItem(STORAGE_KEYS.LEGACY_PROGRESS);
    if (oldProgress && !localStorage.getItem(STORAGE_KEYS.PROGRESS_BY_PUZZLE_ID)) {
      const parsed = JSON.parse(oldProgress);
      const migrated: ProgressByPuzzleId = {};
      
      for (const [id, progress] of Object.entries(parsed)) {
        const old = progress as any;
        migrated[id] = {
          foundWords: old.foundWords || [],
          score: old.score || 0,
          superHeptaWords: old.superHeptasFound || [],
          startedAt: old.lastPlayedAt || new Date().toISOString(),
          lastPlayedAt: old.lastPlayedAt || new Date().toISOString(),
        };
      }
      
      localStorage.setItem(STORAGE_KEYS.PROGRESS_BY_PUZZLE_ID, JSON.stringify(migrated));
      console.log('✓ Migrado progressByPuzzle');
    }
    
    // Migrar currentPuzzleId -> activePuzzleId
    const oldCurrentId = localStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_PUZZLE);
    if (oldCurrentId && !localStorage.getItem(STORAGE_KEYS.ACTIVE_PUZZLE_ID)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PUZZLE_ID, oldCurrentId);
      console.log('✓ Migrado currentPuzzleId');
    }
    
    // Migrar settings -> playerState
    const oldSettings = localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
    if (oldSettings && !localStorage.getItem(STORAGE_KEYS.PLAYER_STATE)) {
      const parsed = JSON.parse(oldSettings);
      const newPlayerState: PlayerState = {
        xpTotal: 0,
        level: 1,
        cosmeticsUnlocked: [],
        settings: {
          soundEnabled: parsed.soundEnabled ?? true,
          activeTheme: 'default',
          activeFont: 'classic',
        },
      };
      localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(newPlayerState));
      console.log('✓ Migrado settings a playerState');
    }
    
    // Migrar gameState legacy si existe
    const oldGameState = localStorage.getItem(STORAGE_KEYS.LEGACY_GAME_STATE);
    if (oldGameState) {
      const parsed: GameState = JSON.parse(oldGameState);
      const existing = loadAllProgress();
      
      if (!existing[parsed.puzzleId]) {
        existing[parsed.puzzleId] = {
          foundWords: parsed.foundWords || [],
          score: parsed.score || 0,
          superHeptaWords: parsed.achievements?.superHeptaWords || [],
          startedAt: new Date().toISOString(),
          lastPlayedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEYS.PROGRESS_BY_PUZZLE_ID, JSON.stringify(existing));
        console.log('✓ Migrado gameState legacy');
      }
    }
    
    migrationDone = true;
  } catch (err) {
    console.error('Error durante migración:', err);
  }
}

// ========================================
// Active Puzzle ID
// ========================================

export function saveActivePuzzleId(puzzleId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PUZZLE_ID, puzzleId);
  } catch (err) {
    console.error('Error guardando puzzle activo:', err);
  }
}

export function loadActivePuzzleId(): string | null {
  migrateOldData();
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PUZZLE_ID);
  } catch {
    return null;
  }
}

// ========================================
// Progress by Puzzle ID
// ========================================

export function loadPuzzleProgress(puzzleId: string): PuzzleProgress | null {
  migrateOldData();
  try {
    const allProgress = loadAllProgress();
    return allProgress[puzzleId] || null;
  } catch {
    return null;
  }
}

export function savePuzzleProgress(puzzleId: string, progress: PuzzleProgress): void {
  try {
    const allProgress = loadAllProgress();
    allProgress[puzzleId] = progress;
    localStorage.setItem(STORAGE_KEYS.PROGRESS_BY_PUZZLE_ID, JSON.stringify(allProgress));
  } catch (err) {
    console.error('Error guardando progreso del puzzle:', err);
  }
}

export function loadAllProgress(): ProgressByPuzzleId {
  migrateOldData();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS_BY_PUZZLE_ID);
    if (!data) return {};
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// ========================================
// Player State
// ========================================

export function loadPlayerState(): PlayerState {
  migrateOldData();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
    if (!data) {
      return getDefaultPlayerState();
    }
    const parsed = JSON.parse(data) as PlayerState;
    if (!parsed.settings.activeFont) {
      parsed.settings.activeFont = 'classic';
    }
    return parsed;
  } catch {
    return getDefaultPlayerState();
  }
}

export function savePlayerState(state: PlayerState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(state));
  } catch (err) {
    console.error('Error guardando estado del jugador:', err);
  }
}

/**
 * Añade XP al jugador y actualiza el nivel automáticamente
 */
export function addXP(xpAmount: number): PlayerState {
  const state = loadPlayerState();
  state.xpTotal += xpAmount;
  
  // Recalcular nivel basado en XP total
  // (esto se hace en el componente que usa xpSystem.calculateLevel)
  
  savePlayerState(state);
  return state;
}

/**
 * Actualiza el nivel del jugador
 */
export function updateLevel(newLevel: number): void {
  const state = loadPlayerState();
  state.level = newLevel;
  savePlayerState(state);
}

function getDefaultPlayerState(): PlayerState {
  return {
    xpTotal: 0,
    level: 1,
    cosmeticsUnlocked: [],
    settings: {
      soundEnabled: true,
      activeTheme: 'default',
      activeFont: 'classic',
    },
  };
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
export function saveSettings(settings: { soundEnabled: boolean }): void {
  const playerState = loadPlayerState();
  playerState.settings.soundEnabled = settings.soundEnabled;
  // Mantener tema actual si existe
  if (!playerState.settings.activeTheme) {
    playerState.settings.activeTheme = 'default';
  }
  if (!playerState.settings.activeFont) {
    playerState.settings.activeFont = 'classic';
  }
  savePlayerState(playerState);
}

// ========================================
// Utilidades
// ========================================

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  migrationDone = false;
}
