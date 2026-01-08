/**
 * Storage module - Punto de entrada principal
 * Exporta toda la API de almacenamiento
 */

// API principal
export {
  getPlayerState,
  setPlayerState,
  getSettings,
  setSettings,
  getExoticsRunState,
  setExoticsRunState,
  getDailySessions,
  setDailySessions,
  getDailyProgress,
  setDailyProgress,
  listDailyProgress,
  getClassicProgress,
  setClassicProgress,
  listClassicProgress,
  clearAllData,
} from './api';

// Export/Import
export {
  exportToJson,
  downloadExportJson,
  importFromJson,
  handleFileImport,
} from './exportImport';

// Migración
export { migrateFromLocalStorage, resetMigrationFlag } from './migration';

// Tipos
export type {
  KVEntry,
  DailyProgress,
  ClassicProgress,
  ExportData,
} from './types';

export { SAVE_VERSION } from './types';

// Database management
export { openDatabase, closeDatabase } from './db';
