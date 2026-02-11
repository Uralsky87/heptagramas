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
      <div className="home-screen">
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
            <span className="menu-btn-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <rect x="6" y="9" width="36" height="33" rx="4" />
                <line x1="6" y1="18" x2="42" y2="18" />
                <line x1="16" y1="6" x2="16" y2="14" />
                <line x1="32" y1="6" x2="32" y2="14" />
                <line x1="16" y1="26" x2="22" y2="26" />
                <line x1="26" y1="26" x2="32" y2="26" />
                <line x1="16" y1="32" x2="22" y2="32" />
                <line x1="26" y1="32" x2="32" y2="32" />
              </svg>
            </span>
            <span className="menu-btn-title">{t('home.daily_title')}</span>
            <span className="menu-btn-desc">{t('home.daily_desc')}</span>
          </button>

          <button 
            className="menu-btn menu-btn-classic"
            onClick={() => onNavigate('classic')}
          >
            <span className="menu-btn-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <path d="M8 14H22C26 14 28 16 28 20V36C28 32 26 30 22 30H8Z" />
                <path d="M40 14H26C22 14 20 16 20 20V36C20 32 22 30 26 30H40Z" />
                <line x1="24" y1="14" x2="24" y2="36" />
              </svg>
            </span>
            <span className="menu-btn-title">{t('home.classic_title')}</span>
            <span className="menu-btn-desc">{t('home.classic_desc')}</span>
          </button>

          <button 
            className="menu-btn menu-btn-exotic"
            onClick={() => onNavigate('exotic')}
          >
            <span className="menu-btn-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <path d="M24 6L38 18L24 42L10 18Z" />
                <circle cx="24" cy="24" r="4" />
                <line x1="24" y1="10" x2="24" y2="18" />
                <line x1="24" y1="30" x2="24" y2="38" />
                <line x1="16" y1="18" x2="24" y2="24" />
                <line x1="32" y1="18" x2="24" y2="24" />
              </svg>
            </span>
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
      </div>
    </PageContainer>
  );
}
