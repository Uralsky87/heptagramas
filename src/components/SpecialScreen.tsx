import type { Puzzle } from '../types';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import BackChevronIcon from './icons/BackChevronIcon';
import { useLanguage } from '../contexts/useLanguage';

interface SpecialScreenProps {
  puzzle: Puzzle | null;
  onBack: () => void;
  onPlay: () => void;
}

export default function SpecialScreen({ puzzle, onBack, onPlay }: SpecialScreenProps) {
  const { t } = useLanguage();

  return (
    <PageContainer>
      <TopBar
        onSettingsClick={() => {}}
        title={t('special.mothers_day_title')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <div className="special-content">
        <section className="special-card">
          <div className="special-card-header">
            <span className="special-card-icon" aria-hidden="true">
              <svg className="home-icon" viewBox="0 0 48 48">
                <path d="M24 40C16 34 10 28 10 20C10 15 13 12 18 12C21 12 23 14 24 16C25 14 27 12 30 12C35 12 38 15 38 20C38 28 32 34 24 40Z" />
                <path d="M24 16V36" />
                <path d="M16 24H32" />
              </svg>
            </span>
            <div>
              <h2>{t('special.mothers_day_title')}</h2>
              <p>{t('special.mothers_day_desc')}</p>
            </div>
          </div>

          {puzzle ? (
            <>
              <div className="special-puzzle-preview">
                <span className="center-letter-big">{puzzle.center.toUpperCase()}</span>
                <span className="outer-letters-big">{puzzle.outer.map((letter) => letter.toUpperCase()).join(' ')}</span>
              </div>

              <button className="btn-play-today" onClick={onPlay}>
                {t('special.play')}
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
