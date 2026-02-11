/**
 * Export/Import de datos en formato JSON
 */

import type { ExportData } from './types';
import {
  getPlayerState,
  setPlayerState,
  getSettings,
  setSettings,
  getExoticsRunState,
  setExoticsRunState,
  getDailySessions,
  setDailySessions,
  listDailyProgress,
  setDailyProgress,
  listClassicProgress,
  setClassicProgress,
  clearAllData,
} from './api';
import { SAVE_VERSION } from './types';

// ========================================
// Export
// ========================================

/**
 * Exporta todos los datos a un objeto JSON
 */
export async function exportToJson(): Promise<ExportData> {
  const playerState = await getPlayerState();
  const settings = await getSettings();
  const exoticsRunState = await getExoticsRunState();
  const dailyProgress = await listDailyProgress();
  const classicProgress = await listClassicProgress();
  const dailySessions = await getDailySessions();

  // PlayerState por defecto si no existe
  const defaultPlayerState: ExportData['data']['playerState'] = {
    xpTotal: 0,
    level: 1,
    cosmeticsUnlocked: [] as string[],
    settings: {
      soundEnabled: true,
      activeTheme: 'default',
      activeFont: 'classic',
    },
    saveVersion: SAVE_VERSION,
  };

  return {
    schema: 'heptagramas-save',
    saveVersion: SAVE_VERSION,
    exportedAt: Date.now(),
    data: {
      playerState: playerState
        ? { ...playerState, saveVersion: SAVE_VERSION }
        : defaultPlayerState,
      settings: settings || undefined,
      exoticsRunState: exoticsRunState || null,
      daily: dailyProgress,
      classic: classicProgress,
      dailySessions: dailySessions || undefined,
    },
  };
}

/**
 * Descarga el export como archivo JSON
 */
export async function downloadExportJson(): Promise<void> {
  try {
    const exportData = await exportToJson();
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Generar nombre con timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `heptagramas-backup-${timestamp}.json`;
    
    // Crear link temporal y disparar descarga
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('[Export] ✓ Archivo descargado:', filename);
  } catch (error) {
    console.error('[Export] Error al descargar:', error);
    throw error;
  }
}

// ========================================
// Import
// ========================================

/**
 * Valida que el JSON tenga la estructura correcta
 */
function validateImportData(data: any): data is ExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Datos inválidos: no es un objeto');
  }

  if (data.schema !== 'heptagramas-save') {
    throw new Error(`Schema inválido: esperado "heptagramas-save", recibido "${data.schema}"`);
  }

  if (typeof data.saveVersion !== 'number') {
    throw new Error('Falta saveVersion o no es un número');
  }

  if (!data.data || typeof data.data !== 'object') {
    throw new Error('Falta campo "data"');
  }

  if (!data.data.playerState || typeof data.data.playerState !== 'object') {
    throw new Error('Falta campo "data.playerState"');
  }

  return true;
}

/**
 * Importa datos desde un archivo JSON
 * @param file Archivo JSON a importar
 * @param mode 'replace' - reemplaza todos los datos existentes
 */
export async function importFromJson(
  file: File,
  mode: 'replace' = 'replace'
): Promise<{ success: boolean; message: string }> {
  try {
    // Leer archivo
    const text = await file.text();
    const data = JSON.parse(text);

    // Validar estructura
    validateImportData(data);

    // Modo replace: borrar todo y cargar nuevo
    if (mode === 'replace') {
      console.log('[Import] Borrando datos existentes...');
      await clearAllData();

      // Importar playerState
      if (data.data.playerState) {
        console.log('[Import] Importando playerState...');
        await setPlayerState(data.data.playerState);
      }

      // Importar settings (si existe)
      if (data.data.settings) {
        console.log('[Import] Importando settings...');
        await setSettings(data.data.settings);
      }

      // Importar exoticsRunState
      if (data.data.exoticsRunState) {
        console.log('[Import] Importando exoticsRunState...');
        await setExoticsRunState(data.data.exoticsRunState);
      }

      // Importar dailySessions (compatibilidad)
      if (data.data.dailySessions) {
        console.log('[Import] Importando dailySessions...');
        await setDailySessions(data.data.dailySessions);
      }

      // Importar daily progress
      if (Array.isArray(data.data.daily)) {
        console.log(`[Import] Importando ${data.data.daily.length} días...`);
        for (const progress of data.data.daily) {
          await setDailyProgress(progress);
        }
      }

      // Importar classic progress
      if (Array.isArray(data.data.classic)) {
        console.log(`[Import] Importando ${data.data.classic.length} puzzles clásicos...`);
        for (const progress of data.data.classic) {
          await setClassicProgress(progress);
        }
      }

      console.log('[Import] ✓ Importación completada');
      return {
        success: true,
        message: `Datos importados correctamente (${data.data.daily?.length || 0} días, ${data.data.classic?.length || 0} clásicos)`,
      };
    }

    return { success: false, message: 'Modo de importación no soportado' };
  } catch (error) {
    console.error('[Import] Error:', error);
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, message: `Error al importar: ${message}` };
  }
}

/**
 * Maneja la selección de archivo desde un input file
 */
export async function handleFileImport(
  event: Event,
  mode: 'replace' = 'replace'
): Promise<{ success: boolean; message: string }> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return { success: false, message: 'No se seleccionó ningún archivo' };
  }

  return importFromJson(file, mode);
}
