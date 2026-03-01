import { useState, useRef, useEffect } from 'react';
import PageContainer from './layout/PageContainer';
import { downloadExportJson, importFromJson, clearAllData } from '../storage';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => loadPlayerState().settings.soundEnabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutsRef = useRef<number[]>([]);
  const { language, setLanguage, t } = useLanguage();
  // Eliminar cualquier lógica relacionada con la fuente

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    scheduleTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      await downloadExportJson();
      showMessage('success', '✓ Progreso exportado correctamente');
    } catch (error) {
      console.error('[Settings] Error al exportar:', error);
      showMessage('error', '✗ Error al exportar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const result = await importFromJson(file, 'replace');
      
      if (result.success) {
        showMessage('success', '✓ ' + result.message);
        
        // Recargar la página después de importar para refrescar el estado
        scheduleTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showMessage('error', '✗ ' + result.message);
      }
    } catch (error) {
      console.error('[Settings] Error al importar:', error);
      showMessage('error', '✗ Error al importar: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteRequest = () => {
    setShowDeleteConfirm(true);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText.toLowerCase() !== 'borrar') {
      showMessage('error', 'Debes escribir "BORRAR" para confirmar');
      return;
    }

    try {
      setIsProcessing(true);
      await clearAllData();
      showMessage('success', '✓ Todos los datos han sido borrados');
      
      // Recargar la página después de borrar
      scheduleTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[Settings] Error al borrar:', error);
      showMessage('error', '✗ Error al borrar datos: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleToggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);

    try {
      const currentState = loadPlayerState();
      const updatedState = {
        ...currentState,
        settings: {
          ...currentState.settings,
          soundEnabled: newValue,
        },
      };
      await savePlayerState(updatedState);
    } catch (error) {
      console.error('[Settings] Error al guardar sonido:', error);
      setSoundEnabled(!newValue);
      showMessage('error', '✗ Error al actualizar el sonido');
    }
  };

  return (
    <PageContainer>
      <header className="header">
        <button 
          className="btn-back" 
          onClick={onBack}
          disabled={isProcessing}
        >
          {t('common.back')}
        </button>
        <h1>⚙️ {t('settings.title')}</h1>
      </header>

      <div className="settings-container">
        {message && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="settings-section">
          <h2>🌐 {t('settings.language')}</h2>
          <p className="settings-description">
            Selecciona tu idioma preferido. El cambio se aplicará inmediatamente.
          </p>
          <div className="settings-actions">
            <button 
              className={`settings-btn ${language === 'es' ? 'settings-btn-primary' : 'settings-btn-secondary'}`}
              onClick={() => setLanguage('es')}
              disabled={isProcessing}
            >
              🇪🇸 {t('settings.spanish')}
            </button>
            <button 
              className={`settings-btn ${language === 'en' ? 'settings-btn-primary' : 'settings-btn-secondary'}`}
              onClick={() => setLanguage('en')}
              disabled={isProcessing}
            >
              🇬🇧 {t('settings.english')}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>🔊 {t('settings.sound')}</h2>
          <p className="settings-description">
            Activa o desactiva los efectos al acertar palabras.
          </p>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Efectos de sonido</span>
              <span className="setting-desc">{soundEnabled ? 'Activados' : 'Desactivados'}</span>
            </div>
            <button
              className={`toggle-btn ${soundEnabled ? 'toggle-active' : ''}`}
              onClick={handleToggleSound}
              disabled={isProcessing}
              aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
            >
              <span className="toggle-slider" />
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>📦 Gestión de datos</h2>
          <p className="settings-description">
            Exporta tu progreso para guardarlo como respaldo o importa un archivo guardado previamente.
          </p>

          <div className="settings-actions">
            <button 
              className="settings-btn settings-btn-primary"
              onClick={handleExport}
              disabled={isProcessing}
            >
              📥 Exportar progreso (JSON)
            </button>

            <button 
              className="settings-btn settings-btn-primary"
              onClick={handleImportClick}
              disabled={isProcessing}
            >
              📤 Importar progreso (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>

          <div className="settings-info">
            <p>
              <strong>Exportar:</strong> Descarga un archivo JSON con todo tu progreso (puzzles diarios, clásicos, exóticos y nivel).
            </p>
            <p>
              <strong>Importar:</strong> Carga un archivo JSON previamente exportado. ⚠️ Esto reemplazará todos tus datos actuales.
            </p>
          </div>
        </section>

        <section className="settings-section settings-section-danger">
          <h2>🗑️ Zona de peligro</h2>
          <p className="settings-description">
            Elimina permanentemente todos tus datos locales.
          </p>

          {!showDeleteConfirm ? (
            <button 
              className="settings-btn settings-btn-danger"
              onClick={handleDeleteRequest}
              disabled={isProcessing}
            >
              🗑️ Borrar datos locales
            </button>
          ) : (
            <div className="settings-confirm">
              <p className="settings-confirm-text">
                ⚠️ <strong>¿Estás seguro?</strong> Esta acción no se puede deshacer.
              </p>
              <p className="settings-confirm-text">
                Escribe <strong>"BORRAR"</strong> para confirmar:
              </p>
              <input
                type="text"
                className="settings-confirm-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Escribe BORRAR"
                autoFocus
              />
              <div className="settings-confirm-actions">
                <button 
                  className="settings-btn settings-btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={isProcessing || deleteConfirmText.toLowerCase() !== 'borrar'}
                >
                  Confirmar borrado
                </button>
                <button 
                  className="settings-btn settings-btn-secondary"
                  onClick={handleDeleteCancel}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="settings-section">
          <h2>ℹ️ Información</h2>
          <p className="settings-info-text">
            <strong>Almacenamiento:</strong> IndexedDB (offline)
          </p>
          <p className="settings-info-text">
            <strong>Versión:</strong> 1.0.0
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
