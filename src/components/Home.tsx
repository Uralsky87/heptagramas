import { useEffect, useState } from 'react';
import { loadPlayerState } from '../lib/storage';
import { getLevelProgress } from '../lib/xpSystem';
import ThemeSelector from './ThemeSelector';

interface HomeProps {
  onNavigate: (screen: 'daily' | 'classic' | 'exotic') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [levelInfo, setLevelInfo] = useState<{
    level: number;
    progressPercentage: number;
    xpInLevel: number;
    xpNeeded: number;
  } | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    const playerState = loadPlayerState();
    const progress = getLevelProgress(playerState.xpTotal);
    
    setLevelInfo({
      level: progress.currentLevel,
      progressPercentage: progress.progressPercentage,
      xpInLevel: progress.xpInCurrentLevel,
      xpNeeded: progress.xpNeededForNext,
    });
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-header-top">
          <h1>🌟 Heptagramas</h1>
          <button 
            className="btn-settings"
            onClick={() => setShowThemeSelector(true)}
            title="Temas"
          >
            🎨
          </button>
        </div>
        <p className="home-subtitle">Encuentra palabras con 7 letras mágicas</p>
        
        {levelInfo && (
          <div className="level-display">
            <div className="level-header">
              <span className="level-text">Nivel {levelInfo.level}</span>
              <span className="level-xp">
                {levelInfo.xpInLevel} / {levelInfo.xpNeeded} XP
              </span>
            </div>
            <div className="level-bar-container">
              <div 
                className="level-bar-fill" 
                style={{ width: `${levelInfo.progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <div className="home-menu">
        <button 
          className="menu-btn menu-btn-daily"
          onClick={() => onNavigate('daily')}
        >
          <span className="menu-btn-icon">📅</span>
          <span className="menu-btn-title">Puzzle Diario</span>
          <span className="menu-btn-desc">Uno nuevo cada día</span>
        </button>

        <button 
          className="menu-btn menu-btn-classic"
          onClick={() => onNavigate('classic')}
        >
          <span className="menu-btn-icon">🎯</span>
          <span className="menu-btn-title">Clásicos</span>
          <span className="menu-btn-desc">Elige tu puzzle favorito</span>
        </button>

        <div className="exotic-info-card">
          <div className="exotic-info-icon">✨</div>
          <div className="exotic-info-text">
            <strong>Modo Exótico disponible</strong>
            <p>Activa el modo exótico dentro de cualquier puzzle para añadir una 8ª letra y descubrir más palabras.</p>
          </div>
        </div>
      </div>

      {showThemeSelector && (
        <ThemeSelector onClose={() => setShowThemeSelector(false)} />
      )}
      
      <div className="app-version">
        Heptagramas v0.33
      </div>
    </div>
  );
}
