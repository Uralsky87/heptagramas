import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleProgress } from '../types';
import { 
  getDailyKey, 
  getDailySession, 
  getLastNDays, 
  formatDateKey,
  getDailyPuzzleForDate 
} from '../lib/dailySession';
import { loadPuzzleProgress } from '../lib/storage';
import { solvePuzzle } from '../lib/solvePuzzle';
import type { DictionaryData } from '../lib/dictionary';

interface DailyScreenProps {
  puzzles: Puzzle[];
  dictionary: DictionaryData;
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

export default function DailyScreen({ puzzles, dictionary, onPlayDaily, onBack }: DailyScreenProps) {
  const [daysInfo, setDaysInfo] = useState<DayInfo[]>([]);
  const todayKey = getDailyKey();

  useEffect(() => {
    // Obtener últimos 7 días
    const last7Days = getLastNDays(7);
    
    // Crear info inicial
    const initialInfo: DayInfo[] = last7Days.map(dateKey => {
      const session = getDailySession(dateKey, puzzles);
      const puzzle = getDailyPuzzleForDate(dateKey, puzzles);
      const progress = loadPuzzleProgress(session.progressId);
      
      return {
        dateKey,
        puzzleId: session.puzzleId,
        progressId: session.progressId,
        progress,
        solutionCount: null,
        puzzle,
      };
    });
    
    setDaysInfo(initialInfo);

    // Calcular soluciones de forma asíncrona
    last7Days.forEach((dateKey, index) => {
      setTimeout(() => {
        getDailySession(dateKey, puzzles); // Crear sesión si no existe
        const puzzle = getDailyPuzzleForDate(dateKey, puzzles);
        const minLen = puzzle.minLen || 3;
        const allowEnye = puzzle.allowEnye || false;
        const solutions = solvePuzzle(
          puzzle.center,
          puzzle.outer,
          dictionary,
          minLen,
          allowEnye
        );

        setDaysInfo(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              solutionCount: solutions.length,
            };
          }
          return updated;
        });
      }, index * 10);
    });
  }, [puzzles, dictionary]);

  const handlePlayDaily = (dateKey: string) => {
    onPlayDaily(dateKey);
  };

  return (
    <div className="daily-screen-container">
      <header className="daily-header">
        <button className="btn-back" onClick={onBack}>
          ← Inicio
        </button>
        <h1>📅 Heptagramas Diarios</h1>
      </header>

      <div className="daily-content">
        {/* Heptagrama de hoy - destacado */}
        {daysInfo.length > 0 && (
          <div className="today-card">
            <div className="today-card-header">
              <h2>🌟 Heptagrama de hoy</h2>
              <p className="today-date">{formatDateKey(todayKey)}</p>
            </div>
            
            <div className="today-card-body">
              <div className="puzzle-preview">
                <div className="puzzle-letters">
                  <span className="center-letter-big">
                    {daysInfo[0].puzzle.center.toUpperCase()}
                  </span>
                  <span className="outer-letters-big">
                    {daysInfo[0].puzzle.outer.map(l => l.toUpperCase()).join(' ')}
                  </span>
                </div>
                
                {daysInfo[0].solutionCount !== null && (
                  <p className="solution-count-big">
                    📝 {daysInfo[0].solutionCount} palabras
                  </p>
                )}
              </div>

              {daysInfo[0].progress && daysInfo[0].progress.foundWords.length > 0 && (
                <div className="today-progress">
                  <p className="progress-label">Tu progreso:</p>
                  <div className="progress-bar-big">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.round((daysInfo[0].progress.foundWords.length / (daysInfo[0].solutionCount || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                  <p className="progress-text-big">
                    {daysInfo[0].progress.foundWords.length} / {daysInfo[0].solutionCount || '?'} palabras
                  </p>
                </div>
              )}

              <button 
                className="btn-play-today"
                onClick={() => handlePlayDaily(todayKey)}
              >
                {daysInfo[0].progress && daysInfo[0].progress.foundWords.length > 0 
                  ? '▶ Continuar jugando' 
                  : '▶ Jugar ahora'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de días anteriores */}
        <div className="previous-days">
          <h3 className="section-title">Días anteriores</h3>
          <div className="days-list">
            {daysInfo.slice(1).map((dayInfo) => {
              const hasProgress = dayInfo.progress && dayInfo.progress.foundWords.length > 0;
              const progressPercent = dayInfo.solutionCount
                ? Math.round((dayInfo.progress?.foundWords.length || 0) / dayInfo.solutionCount * 100)
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
                        {dayInfo.puzzle.outer.map(l => l.toUpperCase()).join(' ')}
                      </span>
                    </div>
                  </div>

                  <div className="day-card-body">
                    {dayInfo.solutionCount === null ? (
                      <span className="calculating">Calculando...</span>
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
                          <span className="no-progress">Sin jugar</span>
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
    </div>
  );
}
