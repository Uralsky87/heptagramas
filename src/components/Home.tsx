import { useEffect, useState } from 'react';
import { loadPlayerState } from '../lib/storageAdapter';
import { getLevelProgress } from '../lib/xpSystem';
import ThemeSelector from './ThemeSelector';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
  onNavigate: (screen: 'daily' | 'classic' | 'exotic') => void;
  onNavigateToSettings?: () => void;
}

export default function Home({ onNavigate, onNavigateToSettings }: HomeProps) {
  const { t } = useLanguage();
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
    <PageContainer>
      <TopBar 
        onThemeClick={() => setShowThemeSelector(true)}
        onSettingsClick={onNavigateToSettings || (() => {})}
      />

      <header className="home-header">
        <p className="home-subtitle">{t('home.subtitle')}</p>
        
        {levelInfo && (
          <div className="level-display">
            <div className="level-header">
              <span className="level-text">{t('home.level')} {levelInfo.level}</span>
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
          <span className="menu-btn-title">{t('home.daily_title')}</span>
          <span className="menu-btn-desc">{t('home.daily_desc')}</span>
        </button>

        <button 
          className="menu-btn menu-btn-classic"
          onClick={() => onNavigate('classic')}
        >
          <span className="menu-btn-icon">🎯</span>
          <span className="menu-btn-title">{t('home.classic_title')}</span>
          <span className="menu-btn-desc">{t('home.classic_desc')}</span>
        </button>

        <button 
          className="menu-btn menu-btn-exotic"
          onClick={() => onNavigate('exotic')}
        >
          <span className="menu-btn-icon">✨</span>
          <span className="menu-btn-title">{t('home.exotic_title')}</span>
          <span className="menu-btn-desc">{t('home.exotic_desc')}</span>
        </button>
      </div>

      {showThemeSelector && (
        <ThemeSelector onClose={() => setShowThemeSelector(false)} />
      )}
      
      <div className="app-version">
        {t('home.version')} v0.6
      </div>
    </PageContainer>
  );
}
