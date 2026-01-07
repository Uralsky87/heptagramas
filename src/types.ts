export interface Puzzle {
  id: string;
  title: string;
  center: string;
  outer: string[]; // 6 letras exteriores
  mode: 'daily' | 'classic'; // tipo de puzzle
  minLen?: number; // longitud mínima (default: 3)
  allowEnye?: boolean; // si permite ñ (default: false)
  targetRange?: { min: number; max: number }; // rango de palabras objetivo
  solutionCount?: number; // número de soluciones válidas (precalculado)
}

export interface PuzzleProgress {
  foundWords: string[];
  score: number;
  superHeptaWords: string[];
  startedAt: string; // ISO string
  lastPlayedAt: string; // ISO string
  exoticLetter?: string; // Letra extra para modo exótico (opcional)
}

export interface PlayerState {
  xpTotal: number;
  level: number;
  cosmeticsUnlocked: string[];
  settings: PlayerSettings;
}

export interface PlayerSettings {
  soundEnabled: boolean;
  activeTheme: string; // ID del tema activo
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

// ========================================
// MODO EXÓTICOS
// ========================================

export interface ExoticPuzzle {
  center: string;
  outer: string[]; // 6 letras
  allowExtraLetters: true; // Siempre true para exóticos
}

export interface ExoticsRunState {
  runId: string; // UUID único para esta run
  startedAt: string; // ISO timestamp
  puzzle: ExoticPuzzle;
  extraLetters: string[]; // Letras extra añadidas por el jugador (empieza vacío)
  solutionsTotal: number; // Total de soluciones posibles con las letras actuales
  foundWords: string[]; // DEPRECATED - mantener por compatibilidad, usar foundWordsAll
  foundWordsAll: string[]; // Todas las palabras encontradas históricamente en este puzzle
  scorePoints: number; // Puntos acumulados (P)
  xpEarned: number; // XP acumulado durante esta run (no se suma a global hasta terminar)
  streak10Count: number; // Cuántos hitos de 10 palabras se han cobrado
  milestones: {
    reached50Percent: boolean; // Si ya alcanzó el 50% en este puzzle
    reached100Found: boolean; // Si ya encontró 100 palabras
    claimed50PercentBonus: boolean; // Si ya cobró el bonus de +250 P por 50%
  };
  doublePointsRemaining: number; // 0 o 10 - palabras restantes con doble puntuación
  statsUnlocked: {
    byStartLetter: boolean; // Si se desbloqueó ver palabras por letra inicial
    lengthHint: boolean; // Si se compró pista de longitud
  };
  uiState: {
    lengthHintExpanded: boolean; // Si el panel de pista de longitud está visible
    byStartLetterExpanded: boolean; // Si el panel de letra inicial está visible
    runPanelMinimized: boolean; // Si el panel Run Activa está minimizado
  };
}

// Legacy - mantener para migración
export interface GameState {
  puzzleId: string;
  foundWords: string[];
  score: number;
  achievements: {
    superHeptaWords: string[];
  };
}
