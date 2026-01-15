import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleProgress } from '../types';
import { loadPuzzleProgress, saveActivePuzzleId } from '../lib/storageAdapter';
import { solvePuzzle } from '../lib/solvePuzzle';
import type { DictionaryData } from '../lib/dictionary';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';

interface ClassicListProps {
  puzzles: Puzzle[];
  dictionary: DictionaryData;
  onSelectPuzzle: (puzzle: Puzzle) => void;
  onBack: () => void;
}

interface PuzzleWithMeta extends Omit<Puzzle, 'solutionCount'> {
  solutionCount: number | null;
  progress: PuzzleProgress | null;
}

export default function ClassicList({ puzzles, dictionary, onSelectPuzzle, onBack }: ClassicListProps) {
  const [puzzlesWithMeta, setPuzzlesWithMeta] = useState<PuzzleWithMeta[]>([]);

  // Filtrar solo puzzles clásicos
  const classicPuzzles = puzzles.filter(p => p.mode === 'classic');

  useEffect(() => {
    // Inicializar con progreso y solutionCount null
    const initial: PuzzleWithMeta[] = classicPuzzles.map(puzzle => ({
      ...puzzle,
      solutionCount: null,
      progress: loadPuzzleProgress(puzzle.id),
    }));
    setPuzzlesWithMeta(initial);

    // Calcular soluciones de forma asíncrona
    const timers: number[] = [];
    classicPuzzles.forEach((puzzle, index) => {
      const timer = setTimeout(() => {
        const minLen = puzzle.minLen || 3;
        const allowEnye = puzzle.allowEnye ?? true;
        const solutions = solvePuzzle(
          puzzle.center, 
          puzzle.outer, 
          dictionary,
          minLen,
          allowEnye
        );
        setPuzzlesWithMeta(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index] = {
              ...updated[index],
              solutionCount: solutions.length,
            };
          }
          return updated;
        });
      }, index * 10); // Escalonar cálculos para no bloquear UI
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [dictionary]);

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    saveActivePuzzleId(puzzle.id);
    onSelectPuzzle(puzzle);
  };

  return (
    <PageContainer>
      <TopBar 
        onThemeClick={() => {}} 
        onSettingsClick={() => {}}
      />

      <header className="classic-header">
        <button className="btn-back" onClick={onBack}>
          ← Inicio
        </button>
      </header>

      <div className="puzzles-grid-classic">
        {puzzlesWithMeta.map((puzzle) => {
          const hasProgress = puzzle.progress && puzzle.progress.foundWords.length > 0;
          const progressPercent = puzzle.solutionCount 
            ? Math.round((puzzle.progress?.foundWords.length || 0) / puzzle.solutionCount * 100)
            : 0;

          return (
            <div 
              key={puzzle.id} 
              className="puzzle-card"
              onClick={() => handleSelectPuzzle(puzzle as Puzzle)}
            >
              <div className="puzzle-card-header">
                <h3 className="puzzle-card-title">{puzzle.title}</h3>
                <div className="puzzle-card-letters">
                  <span className="center-letter">{puzzle.center.toUpperCase()}</span>
                  <span className="outer-letters">
                    {puzzle.outer.map(l => l.toUpperCase()).join(' ')}
                  </span>
                </div>
              </div>

              <div className="puzzle-card-meta">
                <div className="solution-count">
                  {puzzle.solutionCount === null ? (
                    <span className="calculating">Calculando...</span>
                  ) : (
                    <span>📝 {puzzle.solutionCount} palabras</span>
                  )}
                </div>

                {hasProgress && (
                  <div className="puzzle-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {puzzle.progress!.foundWords.length} / {puzzle.solutionCount || '?'} ({progressPercent}%)
                    </span>
                  </div>
                )}
              </div>

              <button 
                className={`btn-play ${hasProgress ? 'has-progress' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPuzzle(puzzle as Puzzle);
                }}
              >
                {hasProgress ? '▶ Continuar' : '▶ Jugar'}
              </button>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
