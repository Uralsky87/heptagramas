import type { Puzzle } from '../types';
import { getEventProgressId, getEventPuzzleAvailability, type EventPuzzle } from '../lib/specialPuzzles';
import { loadPuzzleProgress } from '../lib/storageAdapter';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import BackChevronIcon from './icons/BackChevronIcon';
import { useLanguage } from '../contexts/useLanguage';

interface SpecialScreenProps {
  event?: EventPuzzle;
  puzzle: Puzzle | null;
  onBack: () => void;
  onPlay: () => void;
}

export default function SpecialScreen({ event, puzzle, onBack, onPlay }: SpecialScreenProps) {
  const { t } = useLanguage();
  const title = event?.title ?? puzzle?.title ?? 'Especial';
  const description = event?.description ?? '';
  const availability = event
    ? getEventPuzzleAvailability(event, loadPuzzleProgress(getEventProgressId(event)))
    : null;
  const playLabel = availability && !availability.active && availability.canContinue
    ? t('daily.continue')
    : t('events.play');
  const themeClass = event?.theme && event.theme !== 'default' ? `special-detail-${event.theme}` : '';
  const isSummer = event?.theme === 'summer';

  return (
    <PageContainer className={themeClass ? `special-page-theme ${themeClass}` : ''}>
      <TopBar
        onSettingsClick={() => {}}
        title={title}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <div className={`special-content ${themeClass}`}>
        <section className="special-card">
          <div className="special-card-header">
            <span className="special-card-icon" aria-hidden="true">
              {isSummer ? (
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
                  <path d="M24 16V36" />
                  <path d="M16 24H32" />
                </svg>
              )}
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>

          {puzzle ? (
            <>
              <div className="special-puzzle-preview">
                <span className="center-letter-big">{puzzle.center.toUpperCase()}</span>
                <span className="outer-letters-big">{puzzle.outer.map((letter) => letter.toUpperCase()).join(' ')}</span>
              </div>

              <button className="btn-play-today" onClick={onPlay}>
                {playLabel}
              </button>
            </>
          ) : (
            <p className="special-pending">{t('special.pending')}</p>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
