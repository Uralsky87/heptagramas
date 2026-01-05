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

// Legacy - mantener para migración
export interface GameState {
  puzzleId: string;
  foundWords: string[];
  score: number;
  achievements: {
    superHeptaWords: string[];
  };
}
