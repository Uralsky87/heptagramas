/**
 * Tipos de almacenamiento para IndexedDB
 */

import type { PlayerState, ExoticsRunState } from '../types';

// Versión del schema de guardado (para migraciones futuras)
export const SAVE_VERSION = 1;

// ========================================
// Object Store: kv (key-value genérico)
// ========================================

export interface KVEntry {
  key: string;
  value: any;
  updatedAt: number; // timestamp
}

// ========================================
// Object Store: progress_daily
// ========================================

export interface DailyProgress {
  date: string; // "YYYY-MM-DD" - keyPath
  foundWords: string[];
  completed: boolean;
  lastPlayedAt: number; // timestamp
  totalWords?: number;
  puzzleId?: string; // ID del puzzle usado ese día
  progressId?: string; // "daily-YYYY-MM-DD"
}

// ========================================
// Object Store: progress_classic
// ========================================

export interface ClassicProgress {
  id: string; // keyPath - ID del puzzle
  foundWords: string[];
  completed: boolean;
  lastPlayedAt: number; // timestamp
  totalWords?: number;
  score?: number;
  superHeptaWords?: string[];
  startedAt?: number;
}

// ========================================
// Export/Import Schema
// ========================================

export interface ExportData {
  schema: 'heptagramas-save';
  saveVersion: number;
  exportedAt: number;
  data: {
    playerState: PlayerState & { saveVersion: number };
    settings?: any;
    exoticsRunState: ExoticsRunState | null;
    daily: DailyProgress[];
    classic: ClassicProgress[];
    dailySessions?: Record<string, any>; // Para compatibilidad con sistema actual
  };
}
