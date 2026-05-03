import type { PlayerState } from '../types';
import { APP_VERSION } from './appInfo';

const LAST_APP_VERSION_KEY = 'heptagramas_last_app_version';
const RUNTIME_CACHE_NAMES_TO_CLEAR = ['game-text-assets'];
const ACTIVE_THEME_ALLOWLIST = new Set(['default']);

interface AppVersionMigrationResult {
  playerState: PlayerState | null;
  didRunVersionMigration: boolean;
  didUpdatePlayerState: boolean;
}

function readLastAppVersion(): string | null {
  try {
    return localStorage.getItem(LAST_APP_VERSION_KEY);
  } catch {
    return null;
  }
}

function writeLastAppVersion(): void {
  try {
    localStorage.setItem(LAST_APP_VERSION_KEY, APP_VERSION);
  } catch {
    // Storage can fail in private modes; migrations should not block startup.
  }
}

async function clearRuntimeAssetCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  await Promise.all(
    RUNTIME_CACHE_NAMES_TO_CLEAR.map(async (cacheName) => {
      try {
        await caches.delete(cacheName);
      } catch (error) {
        console.warn(`[AppVersionMigrations] No se pudo limpiar cache "${cacheName}":`, error);
      }
    }),
  );
}

function migratePlayerState(playerState: PlayerState | null): {
  playerState: PlayerState | null;
  didUpdatePlayerState: boolean;
} {
  if (!playerState) {
    return { playerState, didUpdatePlayerState: false };
  }

  let didUpdatePlayerState = false;
  const nextPlayerState: PlayerState = {
    ...playerState,
    settings: {
      ...playerState.settings,
    },
  };

  if (!ACTIVE_THEME_ALLOWLIST.has(nextPlayerState.settings.activeTheme)) {
    nextPlayerState.settings.activeTheme = 'default';
    didUpdatePlayerState = true;
  }

  if (!nextPlayerState.settings.activeFont) {
    nextPlayerState.settings.activeFont = 'classic';
    didUpdatePlayerState = true;
  }

  return {
    playerState: didUpdatePlayerState ? nextPlayerState : playerState,
    didUpdatePlayerState,
  };
}

export async function runAppVersionMigrations(
  playerState: PlayerState | null,
): Promise<AppVersionMigrationResult> {
  const lastAppVersion = readLastAppVersion();
  const didRunVersionMigration = lastAppVersion !== APP_VERSION;

  if (!didRunVersionMigration) {
    return {
      playerState,
      didRunVersionMigration: false,
      didUpdatePlayerState: false,
    };
  }

  await clearRuntimeAssetCaches();
  const result = migratePlayerState(playerState);
  writeLastAppVersion();

  return {
    ...result,
    didRunVersionMigration: true,
  };
}
