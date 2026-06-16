import { loadPlayerState } from '../lib/storageAdapter';
import { getLevelProgress } from '../lib/xpSystem';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import { useLanguage } from '../contexts/useLanguage';
import { APP_VERSION } from '../lib/appInfo';
import { getActiveEventPuzzles } from '../lib/specialPuzzles';

interface HomeProps {
  onNavigate: (screen: 'daily' | 'classic' | 'exotic' | 'events' | 'special') => void;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToSettings?: () => void;
}

export default function Home({ onNavigate, onNavigateToEvent, onNavigateToSettings }: HomeProps) {
  const { t } = useLanguage();
  const playerState = loadPlayerState();
  const progress = getLevelProgress(playerState.xpTotal);
  const activeEvents = getActiveEventPuzzles();
  const levelInfo: {
    level: number;
    progressPercentage: number;
    xpInLevel: number;
    xpNeeded: number;
  } = {
    level: progress.currentLevel,
    progressPercentage: progress.progressPercentage,
    xpInLevel: progress.xpInCurrentLevel,
    xpNeeded: progress.xpNeededForNext,
  };

  return (
    <PageContainer>
      <div className="home-screen">
        <TopBar 
          onSettingsClick={onNavigateToSettings || (() => {})}
          titlePlate
          showSettingsButton={false}
        />

        <header className="home-header">
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
        </header>

        <div className="home-menu">
          {activeEvents.map((event) => {
            const isChristmas = event.theme === 'christmas';
            const isSummer = event.theme === 'summer';

            return (
              <button
                key={event.id}
                className={`menu-btn menu-btn-special menu-btn-special-${event.theme}`}
                onClick={() => onNavigateToEvent?.(event.id)}
              >
                <span className="menu-btn-icon" aria-hidden="true">
                  {isChristmas ? (
                    <svg className="home-icon home-icon-christmas" viewBox="0 0 48 48">
                      <path className="christmas-star" d="M24 5l1.8 4 4.2.5-3.1 2.8.8 4.1L24 14.2l-3.7 2.2.8-4.1L18 9.5l4.2-.5Z" />
                      <path d="M24 13L13 27h7l-8 10h24l-8-10h7Z" />
                      <path d="M20 37v5h8v-5" />
                      <circle className="christmas-light christmas-light-red" cx="20" cy="27" r="1.9" />
                      <circle className="christmas-light christmas-light-gold" cx="28" cy="31" r="1.9" />
                    </svg>
                  ) : isSummer ? (
                    <svg className="home-icon home-icon-summer" viewBox="0 0 48 48">
                      <circle className="summer-sun" cx="30" cy="15" r="6" />
                      <path className="summer-ray" d="M30 4v4" />
                      <path className="summer-ray" d="M30 22v4" />
                      <path className="summer-ray" d="M19 15h4" />
                      <path className="summer-ray" d="M37 15h4" />
                      <path className="summer-ray" d="M22.2 7.2l2.8 2.8" />
                      <path className="summer-ray" d="M35 20l2.8 2.8" />
                      <path d="M8 31c4.5-4 9-4 13.5 0s9 4 13.5 0" />
                      <path d="M8 39c4.5-4 9-4 13.5 0s9 4 13.5 0" />
                    </svg>
                  ) : (
                    <svg className="home-icon" viewBox="0 0 48 48">
                      <path d="M24 40C16 34 10 28 10 20C10 15 13 12 18 12C21 12 23 14 24 16C25 14 27 12 30 12C35 12 38 15 38 20C38 28 32 34 24 40Z" />
                      <circle cx="24" cy="24" r="4" />
                      <path d="M24 14V34" />
                      <path d="M14 24H34" />
                    </svg>
                  )}
                </span>
                <span className="menu-btn-title">{event.title}</span>
                <span className="menu-btn-desc">{event.description}</span>
              </button>
            );
          })}

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

          <button 
            className="menu-btn menu-btn-events"
            onClick={() => onNavigate('events')}
          >
            <span className="menu-btn-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <rect x="8" y="10" width="32" height="30" rx="4" />
                <path d="M16 6v8" />
                <path d="M32 6v8" />
                <path d="M8 19h32" />
                <path d="M18 28l4 4 8-9" />
              </svg>
            </span>
            <span className="menu-btn-title">{t('home.events_title')}</span>
            <span className="menu-btn-desc">{t('home.events_desc')}</span>
          </button>

          <button
            className="menu-btn menu-btn-settings menu-btn-compact"
            onClick={() => onNavigateToSettings?.()}
          >
            <span className="menu-btn-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="6" />
                <path d="M24 8v5" />
                <path d="M24 35v5" />
                <path d="M8 24h5" />
                <path d="M35 24h5" />
                <path d="M12.7 12.7l3.6 3.6" />
                <path d="M31.7 31.7l3.6 3.6" />
                <path d="M35.3 12.7l-3.6 3.6" />
                <path d="M16.3 31.7l-3.6 3.6" />
              </svg>
            </span>
            <span className="menu-btn-title">{t('common.settings')}</span>
          </button>
        </div>

        <div className="app-version">
          {t('home.version')} v{APP_VERSION}
        </div>
      </div>
    </PageContainer>
  );
}
