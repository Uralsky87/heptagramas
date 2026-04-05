import { useEffect, useState } from 'react';
import type { Puzzle } from '../types';
import { isToday } from '../lib/dailyPuzzle';
import { loadPuzzleProgress, preloadPuzzleProgress } from '../lib/storageAdapter';
import { useLanguage } from '../contexts/LanguageContext';

interface PuzzleSelectorProps {
  puzzles: Puzzle[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onSelectDaily: () => void;
  onClose: () => void;
}

interface ProgressInfo {
  wordsFound: number;
  superHeptas: number;
}

export default function PuzzleSelector({
  puzzles,
  currentPuzzleId,
  onSelectPuzzle,
  onSelectDaily,
  onClose,
}: PuzzleSelectorProps) {
  const { t } = useLanguage();
  const [progressByPuzzleId, setProgressByPuzzleId] = useState<Record<string, ProgressInfo | null>>({});

  useEffect(() => {
    let isCancelled = false;

    async function loadProgress() {
      await Promise.all(puzzles.map((puzzle) => preloadPuzzleProgress(puzzle.id)));
      if (isCancelled) {
        return;
      }

      const nextProgress: Record<string, ProgressInfo | null> = {};
      puzzles.forEach((puzzle) => {
        const progress = loadPuzzleProgress(puzzle.id);
        if (!progress || progress.foundWords.length === 0) {
          nextProgress[puzzle.id] = null;
          return;
        }

        nextProgress[puzzle.id] = {
          wordsFound: progress.foundWords.length,
          superHeptas: progress.superHeptaWords.length,
        };
      });
      setProgressByPuzzleId(nextProgress);
    }

    loadProgress().catch((error) => {
      console.error('[PuzzleSelector] Error cargando progreso:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [puzzles]);

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    onSelectPuzzle(puzzle);
    onClose();
  };

  const handleSelectDaily = () => {
    onSelectDaily();
    onClose();
  };

  return (
    <div className="puzzle-selector-overlay" onClick={onClose}>
      <div className="puzzle-selector-modal" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{t('selector.title')}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            x
          </button>
        </header>

        <div className="modal-content">
          <button className="btn-daily-puzzle" onClick={handleSelectDaily}>
            <span className="daily-icon" aria-hidden="true">D</span>
            <div className="daily-text">
              <strong>{t('selector.daily_title')}</strong>
              <small>{t('selector.daily_subtitle')}</small>
            </div>
          </button>

          <div className="puzzles-list">
            <h3>{t('selector.all_puzzles')}</h3>
            <div className="puzzles-grid">
              {puzzles.map((puzzle) => {
                const progress = progressByPuzzleId[puzzle.id] ?? null;
                const isDailyPuzzle = isToday(puzzle.id, puzzles);
                const isCurrent = puzzle.id === currentPuzzleId;

                return (
                  <button
                    key={puzzle.id}
                    className={`puzzle-card ${isCurrent ? 'active' : ''} ${isDailyPuzzle ? 'daily' : ''}`}
                    onClick={() => handleSelectPuzzle(puzzle)}
                  >
                    <div className="puzzle-card-header">
                      <span className="puzzle-number">
                        {puzzle.id.replace(/\D/g, '')}
                      </span>
                      {isDailyPuzzle && <span className="badge-daily">{t('selector.today_badge')}</span>}
                    </div>
                    <div className="puzzle-card-letters">
                      <span className="center-letter">{puzzle.center.toUpperCase()}</span>
                      <div className="outer-letters-mini">
                        {puzzle.outer.slice(0, 6).map((letter, index) => (
                          <span key={index}>{letter.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                    {progress && (
                      <div className="puzzle-card-progress">
                        <small>
                          {progress.wordsFound} {t('daily.words')}
                          {progress.superHeptas > 0 && ` · ${progress.superHeptas} super`}
                        </small>
                      </div>
                    )}
                    {isCurrent && <div className="badge-current">{t('selector.current_badge')}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
