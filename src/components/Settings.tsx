import { useState, useRef, useEffect } from 'react';
import PageContainer from './layout/PageContainer';
import { downloadExportJson, importFromJson, clearAllData } from '../storage';
import { clearRuntimeCaches, flushPendingWrites, loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { useLanguage } from '../contexts/useLanguage';
import { APP_VERSION } from '../lib/appInfo';

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
  const { t } = useLanguage();
  const deleteKeyword = t('settings.delete_keyword');

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
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
      showMessage('success', `OK ${t('settings.msg_export_success')}`);
    } catch (error) {
      console.error('[Settings] Error al exportar:', error);
      showMessage('error', `Error ${t('settings.msg_export_error')}: ` + (error instanceof Error ? error.message : t('settings.msg_unknown_error')));
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
        clearRuntimeCaches();
        showMessage('success', 'OK ' + result.message);
        scheduleTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showMessage('error', 'Error ' + result.message);
      }
    } catch (error) {
      console.error('[Settings] Error al importar:', error);
      showMessage('error', `Error ${t('settings.msg_import_error')}: ` + (error instanceof Error ? error.message : t('settings.msg_unknown_error')));
    } finally {
      setIsProcessing(false);
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
    if (deleteConfirmText.toLowerCase() !== deleteKeyword.toLowerCase()) {
      showMessage('error', t('settings.msg_delete_keyword_required').replace('{0}', deleteKeyword));
      return;
    }

    try {
      setIsProcessing(true);
      await flushPendingWrites();
      await clearAllData();
      clearRuntimeCaches();
      showMessage('success', `OK ${t('settings.msg_delete_success')}`);
      scheduleTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('[Settings] Error al borrar:', error);
      showMessage('error', `Error ${t('settings.msg_delete_error')}: ` + (error instanceof Error ? error.message : t('settings.msg_unknown_error')));
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
      showMessage('error', `Error ${t('settings.msg_sound_error')}`);
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
        <h1>{t('settings.title')}</h1>
      </header>

      <div className="settings-container">
        {message && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        <section className="settings-section">
          <h2>{t('settings.sound')}</h2>
          <p className="settings-description">
            {t('settings.sound_desc')}
          </p>
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">{t('settings.sound_effects_label')}</span>
              <span className="setting-desc">{soundEnabled ? t('settings.sound_on') : t('settings.sound_off')}</span>
            </div>
            <button
              className={`toggle-btn ${soundEnabled ? 'toggle-active' : ''}`}
              onClick={handleToggleSound}
              disabled={isProcessing}
              aria-label={soundEnabled ? t('settings.sound_aria_disable') : t('settings.sound_aria_enable')}
            >
              <span className="toggle-slider" />
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>{t('settings.data_title')}</h2>
          <p className="settings-description">
            {t('settings.data_desc')}
          </p>

          <div className="settings-actions">
            <button
              className="settings-btn settings-btn-primary"
              onClick={handleExport}
              disabled={isProcessing}
            >
              {t('settings.export_btn')}
            </button>

            <button
              className="settings-btn settings-btn-primary"
              onClick={handleImportClick}
              disabled={isProcessing}
            >
              {t('settings.import_btn')}
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
              <strong>{t('settings.export_label')}</strong> {t('settings.export_info_text')}
            </p>
            <p>
              <strong>{t('settings.import_label')}</strong> {t('settings.import_info_text')}
            </p>
          </div>
        </section>

        <section className="settings-section settings-section-danger">
          <h2>{t('settings.danger_title')}</h2>
          <p className="settings-description">
            {t('settings.danger_desc')}
          </p>

          {!showDeleteConfirm ? (
            <button
              className="settings-btn settings-btn-danger"
              onClick={handleDeleteRequest}
              disabled={isProcessing}
            >
              {t('settings.delete_local_btn')}
            </button>
          ) : (
            <div className="settings-confirm">
              <p className="settings-confirm-text">
                <strong>{t('settings.confirm_sure')}</strong> {t('settings.confirm_irreversible')}
              </p>
              <p className="settings-confirm-text">
                {t('settings.confirm_type_delete')} <strong>"{deleteKeyword}"</strong>:
              </p>
              <input
                type="text"
                className="settings-confirm-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={t('settings.confirm_placeholder')}
                autoFocus
              />
              <div className="settings-confirm-actions">
                <button
                  className="settings-btn settings-btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={isProcessing || deleteConfirmText.toLowerCase() !== deleteKeyword.toLowerCase()}
                >
                  {t('settings.confirm_delete_btn')}
                </button>
                <button
                  className="settings-btn settings-btn-secondary"
                  onClick={handleDeleteCancel}
                  disabled={isProcessing}
                >
                  {t('settings.cancel_btn')}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="settings-section">
          <h2>{t('settings.info_title')}</h2>
          <p className="settings-info-text">
            <strong>{t('settings.info_storage_label')}</strong> {t('settings.info_storage_value')}
          </p>
          <p className="settings-info-text">
            <strong>{t('settings.info_version_label')}</strong> {APP_VERSION}
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
