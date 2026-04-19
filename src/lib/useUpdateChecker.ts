import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_PENDING_KEY = 'heptagramas-update-pending';
const UPDATE_PENDING_SINCE_KEY = 'heptagramas-update-pending-since';
const STALE_UPDATE_MS = 1000 * 60 * 60 * 24;

function readPersistedUpdateFlag(): boolean {
  try {
    return localStorage.getItem(UPDATE_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

function readPendingSince(): number | null {
  try {
    const value = localStorage.getItem(UPDATE_PENDING_SINCE_KEY);
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistUpdateFlag(isPending: boolean) {
  try {
    if (isPending) {
      localStorage.setItem(UPDATE_PENDING_KEY, '1');
      if (!localStorage.getItem(UPDATE_PENDING_SINCE_KEY)) {
        localStorage.setItem(UPDATE_PENDING_SINCE_KEY, String(Date.now()));
      }
    } else {
      localStorage.removeItem(UPDATE_PENDING_KEY);
      localStorage.removeItem(UPDATE_PENDING_SINCE_KEY);
    }
  } catch {
    // Ignorar fallos de storage: el banner seguira funcionando en memoria.
  }
}

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(() => readPersistedUpdateFlag());
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingSince, setPendingSince] = useState<number | null>(() => readPendingSince());
  const updateServiceWorkerRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let updateIntervalId: number | null = null;

    updateServiceWorkerRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateAvailable(true);
        persistUpdateFlag(true);
        setPendingSince(readPendingSince() ?? Date.now());
      },
      onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
        if (!registration) {
          return;
        }

        if (registration.waiting) {
          setUpdateAvailable(true);
          persistUpdateFlag(true);
          setPendingSince(readPendingSince() ?? Date.now());
        }

        updateIntervalId = window.setInterval(async () => {
          try {
            await registration.update();

            if (registration.waiting) {
              setUpdateAvailable(true);
              persistUpdateFlag(true);
              setPendingSince(readPendingSince() ?? Date.now());
            }
          } catch (error) {
            console.error('[UpdateChecker] Error al buscar actualizaciones:', error);
          }
        }, 5 * 60 * 1000);
      },
    });

    const syncWaitingState = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          setUpdateAvailable(true);
          persistUpdateFlag(true);
          setPendingSince(readPendingSince() ?? Date.now());
        }
      } catch (error) {
        console.error('[UpdateChecker] Error comprobando service worker pendiente:', error);
      }
    };

    void syncWaitingState();

    return () => {
      if (updateIntervalId !== null) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    persistUpdateFlag(false);
    setPendingSince(null);

    try {
      await updateServiceWorkerRef.current?.(true);
    } catch (error) {
      console.error('[UpdateChecker] Error al aplicar la actualizacion:', error);
      setIsUpdating(false);
      setUpdateAvailable(true);
      persistUpdateFlag(true);
      setPendingSince(readPendingSince() ?? Date.now());
    }
  };

  const showPersistentMessage =
    updateAvailable &&
    pendingSince !== null &&
    Date.now() - pendingSince >= STALE_UPDATE_MS;

  return { updateAvailable, isUpdating, handleUpdate, showPersistentMessage };
}
