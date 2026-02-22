import { useState, useEffect } from 'react';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { getThemeById, applyTheme } from '../lib/themes';
import { getLevelProgress } from '../lib/xpSystem';
import { applyFont } from '../lib/fonts';

interface ThemeSelectorProps {
  onClose: () => void;
}

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const [playerState, setPlayerState] = useState(loadPlayerState());
  // Eliminada selección de tema/color
  const [soundEnabled, setSoundEnabled] = useState(playerState.settings.soundEnabled);
  // Eliminar selección de fuente, usar Mono Limpia por defecto
  const levelInfo = getLevelProgress(playerState.xpTotal);

  useEffect(() => {
    // Aplicar tema actual al abrir
    const currentTheme = getThemeById(playerState.settings.activeTheme);
    applyTheme(currentTheme);
    applyFont('source-code-pro');
  }, []);


  const handleSave = () => {
    const updatedState = { ...playerState };
    // Dejar el tema por defecto
    updatedState.settings.activeTheme = playerState.settings.activeTheme;
    updatedState.settings.soundEnabled = soundEnabled;
    updatedState.settings.activeFont = 'source-code-pro';
    savePlayerState(updatedState);
    setPlayerState(updatedState);
    onClose();
  };

  const handleCancel = () => {
    // Revertir al tema guardado
    const savedTheme = getThemeById(playerState.settings.activeTheme);
    applyTheme(savedTheme);
    applyFont('source-code-pro');
    onClose();
  };


  return (
    <div className="theme-selector-overlay" onClick={handleCancel}>
      <div className="theme-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-selector-header">
          <h2>🔊 Efectos de sonido</h2>
          <button className="btn-close-modal" onClick={handleCancel}>×</button>
        </div>
        <div className="theme-selector-content">
          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">Sonido al acertar palabras</span>
                <span className="setting-desc">Activa o desactiva los efectos de sonido</span>
              </div>
              <button
                className={`toggle-btn ${soundEnabled ? 'toggle-active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                aria-label={soundEnabled ? 'Desactivar sonido' : 'Activar sonido'}
              >
                <span className="toggle-slider" />
              </button>
            </div>
          </div>
          {/* Progresión visual de niveles (sin selección de tema/color) */}
          <div className="level-progress-section">
            <span className="level-label">Nivel actual: {levelInfo.currentLevel}</span>
            <span className="level-xp">XP: {playerState.xpTotal}</span>
          </div>
        </div>
        <div className="theme-selector-footer">
          <button className="btn-secondary" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
