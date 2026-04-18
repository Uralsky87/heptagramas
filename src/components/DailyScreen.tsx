import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleProgress } from '../types';
import {
  getDailyKey,
  getDailySession,
  getPuzzleForDailySession,
  getLastNDays,
  formatDateKey,
} from '../lib/dailySession';
import { loadPuzzleProgress, preloadPuzzleProgress } from '../lib/storageAdapter';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import BackChevronIcon from './icons/BackChevronIcon';
import { useLanguage } from '../contexts/useLanguage';

interface DailyScreenProps {
  puzzles: Puzzle[];
  onPlayDaily: (dateKey: string) => void;
  onBack: () => void;
}

interface DayInfo {
  dateKey: string;
  puzzleId: string;
  progressId: string;
  progress: PuzzleProgress | null;
  solutionCount: number | null;
  puzzle: Puzzle;
}

export default function DailyScreen({ puzzles, onPlayDaily, onBack }: DailyScreenProps) {
  const { t, language } = useLanguage();
  const [daysInfo, setDaysInfo] = useState<DayInfo[]>([]);
  const todayKey = getDailyKey();

  useEffect(() => {
    let isCancelled = false;

    async function loadDaysInfo() {
      const last7Days = getLastNDays(7);
      const sessions = last7Days.map((dateKey) => getDailySession(dateKey, puzzles, language));

      await Promise.all(sessions.map((session) => preloadPuzzleProgress(session.progressId)));
      if (isCancelled) {
        return;
      }

      const initialInfo: DayInfo[] = last7Days.map((dateKey, index) => {
        const session = sessions[index];
        const puzzle = getPuzzleForDailySession(session, puzzles);
        const progress = loadPuzzleProgress(session.progressId);

        return {
          dateKey,
          puzzleId: session.puzzleId,
          progressId: session.progressId,
          progress,
          solutionCount: puzzle.solutionCount ?? null,
          puzzle,
        };
      });

      setDaysInfo(initialInfo);
    }

    loadDaysInfo().catch((error) => {
      console.error('[DailyScreen] Error cargando sesiones diarias:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [puzzles, language]);

  const handlePlayDaily = (dateKey: string) => {
    onPlayDaily(dateKey);
  };

  return (
    <PageContainer>
      <TopBar
        onThemeClick={() => {}}
        onSettingsClick={() => {}}
        title={t('common.daily')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <div className="daily-content">
        {daysInfo.length > 0 && (
          <div className="today-card">
            <div className="today-card-header">
              <h2>{t('daily.today_title')}</h2>
              <p className="today-date">{formatDateKey(todayKey)}</p>
            </div>

            <div className="today-card-body">
              <div className="puzzle-preview">
                <div className="puzzle-letters">
                  <span className="center-letter-big">
                    {daysInfo[0].puzzle.center.toUpperCase()}
                  </span>
                  <span className="outer-letters-big">
                    {daysInfo[0].puzzle.outer.map((letter) => letter.toUpperCase()).join(' ')}
                  </span>
                </div>

                {daysInfo[0].solutionCount !== null && (
                  <p className="solution-count-big">
                    {daysInfo[0].solutionCount} {t('daily.words')}
                  </p>
                )}
              </div>

              {daysInfo[0].progress && daysInfo[0].progress.foundWords.length > 0 && (
                <div className="today-progress">
                  <p className="progress-label">{t('daily.your_progress')}</p>
                  <div className="progress-bar-big">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round((daysInfo[0].progress.foundWords.length / (daysInfo[0].solutionCount || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="progress-text-big">
                    {daysInfo[0].progress.foundWords.length} / {daysInfo[0].solutionCount || '?'} {t('daily.words')}
                  </p>
                </div>
              )}

              <button
                className="btn-play-today"
                onClick={() => handlePlayDaily(todayKey)}
              >
                {daysInfo[0].progress && daysInfo[0].progress.foundWords.length > 0
                  ? t('daily.continue')
                  : t('daily.play_now')}
              </button>
            </div>
          </div>
        )}

        <div className="previous-days">
          <h3 className="section-title">{t('daily.previous_days')}</h3>
          <p className="section-hint">{t('daily.check_results')}</p>
          <div className="days-list">
            {daysInfo.slice(1).map((dayInfo) => {
              const hasProgress = dayInfo.progress && dayInfo.progress.foundWords.length > 0;
              const progressPercent = dayInfo.solutionCount
                ? Math.round(((dayInfo.progress?.foundWords.length || 0) / dayInfo.solutionCount) * 100)
                : 0;

              return (
                <div
                  key={dayInfo.dateKey}
                  className="day-card"
                  onClick={() => handlePlayDaily(dayInfo.dateKey)}
                >
                  <div className="day-card-header">
                    <h4 className="day-date">{formatDateKey(dayInfo.dateKey)}</h4>
                    <div className="day-letters">
                      <span className="center-letter-small">
                        {dayInfo.puzzle.center.toUpperCase()}
                      </span>
                      <span className="outer-letters-small">
                        {dayInfo.puzzle.outer.map((letter) => letter.toUpperCase()).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="day-card-body">
                    {dayInfo.solutionCount === null ? (
                      <span className="calculating">{t('daily.calculating')}</span>
                    ) : (
                      <>
                        {hasProgress ? (
                          <div className="day-progress">
                            <div className="progress-bar-small">
                              <div
                                className="progress-fill"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="progress-text-small">
                              {dayInfo.progress!.foundWords.length} / {dayInfo.solutionCount} ({progressPercent}%)
                            </span>
                          </div>
                        ) : (
                          <span className="no-progress">{t('daily.not_played')}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
