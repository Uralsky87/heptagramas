/**
 * API de almacenamiento con IndexedDB
 * Funciones CRUD para la aplicación
 */

import { openDatabase } from './db';
import type { KVEntry, DailyProgress, ClassicProgress } from './types';
import type { PlayerState, ExoticsRunState } from '../types';

// ========================================
// KV Store (key-value genérico)
// ========================================

async function getKV<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    const entry = await db.get('kv', key);
    return entry ? entry.value : null;
  } catch (error) {
    console.error(`[Storage] Error al leer key "${key}":`, error);
    return null;
  }
}

async function setKV(key: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    const entry: KVEntry = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await db.put('kv', entry);
  } catch (error) {
    console.error(`[Storage] Error al guardar key "${key}":`, error);
  }
}

async function deleteKV(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    await db.delete('kv', key);
  } catch (error) {
    console.error(`[Storage] Error al eliminar key "${key}":`, error);
  }
}

// ========================================
// PlayerState
// ========================================

export async function getPlayerState(): Promise<PlayerState | null> {
  return getKV<PlayerState>('playerState');
}

export async function setPlayerState(state: PlayerState): Promise<void> {
  // Asegurar que tenga saveVersion
  const stateWithVersion = {
    ...state,
    saveVersion: (state as any).saveVersion || 1,
  };
  await setKV('playerState', stateWithVersion);
}

// ========================================
// Settings (genérico, si se necesita separado)
// ========================================

export async function getSettings(): Promise<any | null> {
  return getKV('settings');
}

export async function setSettings(settings: any): Promise<void> {
  await setKV('settings', settings);
}

// ========================================
// ExoticsRunState
// ========================================

export async function getExoticsRunState(): Promise<ExoticsRunState | null> {
  return getKV<ExoticsRunState>('exoticsRunState');
}

export async function setExoticsRunState(run: ExoticsRunState | null): Promise<void> {
  if (run === null) {
    await deleteKV('exoticsRunState');
  } else {
    await setKV('exoticsRunState', run);
  }
}

// ========================================
// DailySessions (compatibilidad)
// ========================================

export async function getDailySessions(): Promise<Record<string, any> | null> {
  return getKV('dailySessions');
}

export async function setDailySessions(sessions: Record<string, any>): Promise<void> {
  await setKV('dailySessions', sessions);
}

// ========================================
// Daily Progress
// ========================================

export async function getDailyProgress(date: string): Promise<DailyProgress | null> {
  try {
    const db = await openDatabase();
    const progress = await db.get('progress_daily', date);
    return progress || null;
  } catch (error) {
    console.error(`[Storage] Error al leer daily progress "${date}":`, error);
    return null;
  }
}

export async function setDailyProgress(progress: DailyProgress): Promise<void> {
  try {
    const db = await openDatabase();
    await db.put('progress_daily', progress);
  } catch (error) {
    console.error(`[Storage] Error al guardar daily progress:`, error);
  }
}

export async function listDailyProgress(limit?: number): Promise<DailyProgress[]> {
  try {
    const db = await openDatabase();
    const all = await db.getAll('progress_daily');
    
    // Ordenar por fecha descendente
    all.sort((a, b) => b.date.localeCompare(a.date));
    
    if (limit && limit > 0) {
      return all.slice(0, limit);
    }
    
    return all;
  } catch (error) {
    console.error('[Storage] Error al listar daily progress:', error);
    return [];
  }
}

// ========================================
// Classic Progress
// ========================================

export async function getClassicProgress(id: string): Promise<ClassicProgress | null> {
  try {
    const db = await openDatabase();
    const progress = await db.get('progress_classic', id);
    return progress || null;
  } catch (error) {
    console.error(`[Storage] Error al leer classic progress "${id}":`, error);
    return null;
  }
}

export async function setClassicProgress(progress: ClassicProgress): Promise<void> {
  try {
    const db = await openDatabase();
    await db.put('progress_classic', progress);
  } catch (error) {
    console.error(`[Storage] Error al guardar classic progress:`, error);
  }
}

export async function listClassicProgress(): Promise<ClassicProgress[]> {
  try {
    const db = await openDatabase();
    const all = await db.getAll('progress_classic');
    
    // Ordenar por última jugada
    all.sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    
    return all;
  } catch (error) {
    console.error('[Storage] Error al listar classic progress:', error);
    return [];
  }
}

// ========================================
// Clear All Data
// ========================================

export async function clearAllData(): Promise<void> {
  try {
    const db = await openDatabase();
    
    // Limpiar todos los object stores
    await db.clear('kv');
    await db.clear('progress_daily');
    await db.clear('progress_classic');
    
    console.log('[Storage] ✓ Todos los datos borrados');
  } catch (error) {
    console.error('[Storage] Error al borrar datos:', error);
    throw error;
  }
}
