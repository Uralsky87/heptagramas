import { useState, useEffect } from 'react';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { THEMES, getThemeById, isThemeUnlocked, applyTheme, getNextThemeToUnlock } from '../lib/themes';
import { getLevelProgress } from '../lib/xpSystem';
import { FONT_OPTIONS, applyFont } from '../lib/fonts';

interface ThemeSelectorProps {
  onClose: () => void;
}

export default function ThemeSelector({ onClose }: ThemeSelectorProps) {
  const [playerState, setPlayerState] = useState(loadPlayerState());
  const [selectedTheme, setSelectedTheme] = useState(playerState.settings.activeTheme);
  const [soundEnabled, setSoundEnabled] = useState(playerState.settings.soundEnabled);
  const [selectedFont, setSelectedFont] = useState(playerState.settings.activeFont || 'classic');
  const levelInfo = getLevelProgress(playerState.xpTotal);

  useEffect(() => {
    // Aplicar tema actual al abrir
    const currentTheme = getThemeById(playerState.settings.activeTheme);
    applyTheme(currentTheme);
    applyFont(playerState.settings.activeFont || 'classic');
  }, []);

  const handleThemeSelect = (themeId: string) => {
    const theme = getThemeById(themeId);
    
    if (!isThemeUnlocked(themeId, levelInfo.currentLevel)) {
      return; // No permitir seleccionar temas bloqueados
    }
    
    setSelectedTheme(themeId);
    applyTheme(theme);
  };

  const handleSave = () => {
    const updatedState = { ...playerState };
    updatedState.settings.activeTheme = selectedTheme;
    updatedState.settings.soundEnabled = soundEnabled;
    updatedState.settings.activeFont = selectedFont;
    savePlayerState(updatedState);
    setPlayerState(updatedState);
    onClose();
  };

  const handleCancel = () => {
    // Revertir al tema guardado
    const savedTheme = getThemeById(playerState.settings.activeTheme);
    applyTheme(savedTheme);
    applyFont(playerState.settings.activeFont || 'classic');
    onClose();
  };

  const nextTheme = getNextThemeToUnlock(levelInfo.currentLevel);

  return (
    <div className="theme-selector-overlay" onClick={handleCancel}>
      <div className="theme-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="theme-selector-header">
          <h2>🎨 Temas</h2>
          <button className="btn-close-modal" onClick={handleCancel}>×</button>
        </div>

        <div className="theme-selector-content">
          {/* Toggle de sonido */}
          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">🔊 Efectos de sonido</span>
                <span className="setting-desc">Sonido al acertar palabras</span>
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

          <div className="themes-grid">
            {THEMES.map((theme) => {
              const unlocked = isThemeUnlocked(theme.id, levelInfo.currentLevel);
              const isActive = theme.id === selectedTheme;

              return (
                <button
                  key={theme.id}
                  className={`theme-card ${isActive ? 'theme-card-active' : ''} ${!unlocked ? 'theme-card-locked' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                  disabled={!unlocked}
                >
                  <div className="theme-card-preview">
                    <div
                      className="theme-preview-center"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.centerGradientStart}, ${theme.colors.centerGradientEnd})`,
                      }}
                    />
                    <div
                      className="theme-preview-outer"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.outerGradientStart}, ${theme.colors.outerGradientEnd})`,
                      }}
                    />
                    <div
                      className="theme-preview-outer"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.outerGradientStart}, ${theme.colors.outerGradientEnd})`,
                      }}
                    />
                  </div>
                  
                  <div className="theme-card-info">
                    <div className="theme-card-name">{theme.displayName}</div>
                    <div className="theme-card-desc">{theme.description}</div>
                    {!unlocked && (
                      <div className="theme-card-unlock">
                        🔒 Nivel {theme.unlockLevel}
                      </div>
                    )}
                    {isActive && unlocked && (
                      <div className="theme-card-badge">✓ Activo</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="settings-section">
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-label">✍️ Fuente</span>
                <span className="setting-desc">Elige el estilo de letra de la app</span>
              </div>
            </div>
            <div className="fonts-grid">
              {FONT_OPTIONS.map((font) => {
                const isActive = font.id === selectedFont;
                return (
                  <button
                    key={font.id}
                    className={`font-card ${isActive ? 'font-card-active' : ''}`}
                    onClick={() => {
                      setSelectedFont(font.id);
                      applyFont(font.id);
                    }}
                  >
                    <div className="font-card-name" style={{ fontFamily: font.stack }}>
                      {font.label}
                    </div>
                    <div className="font-card-desc">{font.description}</div>
                    {isActive && <div className="font-card-badge">✓ Activa</div>}
                  </button>
                );
              })}
            </div>
          </div>

          {nextTheme && (
            <div className="theme-next-unlock">
              <p>
                <strong>Próximo tema:</strong> {nextTheme.displayName} (Nivel {nextTheme.unlockLevel})
              </p>
              <p className="theme-next-progress">
                {levelInfo.currentLevel < nextTheme.unlockLevel
                  ? `Faltan ${nextTheme.unlockLevel - levelInfo.currentLevel} niveles`
                  : 'Ya disponible'}
              </p>
            </div>
          )}
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
