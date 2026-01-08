/**
 * Configuración y apertura de IndexedDB
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { KVEntry, DailyProgress, ClassicProgress } from './types';

const DB_NAME = 'heptagramas-db';
const DB_VERSION = 1;

export interface HeptagramasDB {
  kv: {
    key: string;
    value: KVEntry;
  };
  progress_daily: {
    key: string;
    value: DailyProgress;
  };
  progress_classic: {
    key: string;
    value: ClassicProgress;
  };
}

let dbInstance: IDBPDatabase<HeptagramasDB> | null = null;

/**
 * Abre la base de datos IndexedDB
 * Crea los object stores si no existen
 */
export async function openDatabase(): Promise<IDBPDatabase<HeptagramasDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<HeptagramasDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      console.log(`[DB] Actualizando de versión ${oldVersion} a ${newVersion}`);

      // Object store: kv (key-value genérico)
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv', { keyPath: 'key' });
        console.log('[DB] ✓ Object store "kv" creado');
      }

      // Object store: progress_daily
      if (!db.objectStoreNames.contains('progress_daily')) {
        db.createObjectStore('progress_daily', { keyPath: 'date' });
        console.log('[DB] ✓ Object store "progress_daily" creado');
      }

      // Object store: progress_classic
      if (!db.objectStoreNames.contains('progress_classic')) {
        db.createObjectStore('progress_classic', { keyPath: 'id' });
        console.log('[DB] ✓ Object store "progress_classic" creado');
      }
    },
    blocked() {
      console.warn('[DB] Conexión bloqueada. Otra pestaña tiene la DB abierta.');
    },
    blocking() {
      console.warn('[DB] Esta pestaña está bloqueando la actualización de la DB.');
    },
  });

  console.log('[DB] ✓ Base de datos abierta:', DB_NAME);
  return dbInstance;
}

/**
 * Cierra la conexión a la base de datos
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[DB] ✓ Base de datos cerrada');
  }
}
