import type { Puzzle } from '../types';
import { isToday } from '../lib/dailyPuzzle';
import { loadPuzzleProgress } from '../lib/storageAdapter';
import { useLanguage } from '../contexts/LanguageContext';

interface PuzzleSelectorProps {
  puzzles: Puzzle[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onSelectDaily: () => void;
  onClose: () => void;
}

export default function PuzzleSelector({
  puzzles,
  currentPuzzleId,
  onSelectPuzzle,
  onSelectDaily,
  onClose,
}: PuzzleSelectorProps) {
  const { t } = useLanguage();

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    onSelectPuzzle(puzzle);
    onClose();
  };

  const handleSelectDaily = () => {
    onSelectDaily();
    onClose();
  };

  const getProgressInfo = (puzzleId: string) => {
    const progress = loadPuzzleProgress(puzzleId);
    if (!progress || progress.foundWords.length === 0) {
      return null;
    }
    return {
      wordsFound: progress.foundWords.length,
      superHeptas: progress.superHeptaWords.length,
    };
  };

  return (
    <div className="puzzle-selector-overlay" onClick={onClose}>
      <div className="puzzle-selector-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{t('selector.title')}</h2>
          <button className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="modal-content">
          {/* Botón Puzzle del Día */}
          <button className="btn-daily-puzzle" onClick={handleSelectDaily}>
            <span className="daily-icon">📅</span>
            <div className="daily-text">
              <strong>{t('selector.daily_title')}</strong>
              <small>{t('selector.daily_subtitle')}</small>
            </div>
          </button>

          {/* Lista de puzzles */}
          <div className="puzzles-list">
            <h3>{t('selector.all_puzzles')}</h3>
            <div className="puzzles-grid">
              {puzzles.map((puzzle) => {
                const progress = getProgressInfo(puzzle.id);
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
                        {puzzle.outer.slice(0, 6).map((letter, i) => (
                          <span key={i}>{letter.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                    {progress && (
                      <div className="puzzle-card-progress">
                        <small>
                          {progress.wordsFound} {t('daily.words')}
                          {progress.superHeptas > 0 && ` · ${progress.superHeptas}⭐`}
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
