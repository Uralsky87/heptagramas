import { useEffect, useState } from 'react';

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return; // SW no soportado
    }

    const handleSWUpdate = () => {
      setUpdateAvailable(true);
    };

    // Escuchar cambios en el controlador
    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate);

    // Buscar actualizaciones cada 5 minutos
    const updateInterval = setInterval(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (err) {
        console.error('[UpdateChecker] Error al buscar actualizaciones:', err);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      clearInterval(updateInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate);
    };
  }, []);

  const handleUpdate = () => {
    setIsUpdating(true);
    // Recargar la página para aplicar la actualización
    window.location.reload();
  };

  return { updateAvailable, isUpdating, handleUpdate };
}
