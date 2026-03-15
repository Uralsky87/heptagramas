import { useState, useEffect, useMemo } from 'react';
import type { Puzzle, PuzzleProgress } from '../types';
import { loadPuzzleProgress, saveActivePuzzleId } from '../lib/storageAdapter';
import { solvePuzzle } from '../lib/solvePuzzle';
import type { DictionaryData } from '../lib/dictionary';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import { useLanguage } from '../contexts/LanguageContext';
import { CLASSIC_LONG_MIN_SOLUTIONS } from '../lib/puzzleRanges';

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

type ClassicMenu = 'sections' | 'long';

export default function ClassicList({ puzzles, dictionary, onSelectPuzzle, onBack }: ClassicListProps) {
  const { t } = useLanguage();
  const [puzzlesWithMeta, setPuzzlesWithMeta] = useState<PuzzleWithMeta[]>([]);
  const [activeMenu, setActiveMenu] = useState<ClassicMenu>('sections');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number | null>(null);
  const PUZZLES_PER_SECTION = 20;

  // Filtrar solo puzzles clásicos
  const classicPuzzles = useMemo(() => puzzles.filter(p => p.mode === 'classic'), [puzzles]);

  useEffect(() => {
    // Inicializar con progreso y solutionCount null
    const initial: PuzzleWithMeta[] = classicPuzzles.map(puzzle => ({
      ...puzzle,
      solutionCount: puzzle.solutionCount ?? null,
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
  }, [classicPuzzles, dictionary]);

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    saveActivePuzzleId(puzzle.id);
    onSelectPuzzle(puzzle);
  };

  const longPuzzles = useMemo(
    () => puzzlesWithMeta.filter((puzzle) => (puzzle.solutionCount ?? 0) >= CLASSIC_LONG_MIN_SOLUTIONS),
    [puzzlesWithMeta]
  );

  const buildSections = (pool: PuzzleWithMeta[]) => {
    const grouped: PuzzleWithMeta[][] = [];
    for (let i = 0; i < pool.length; i += PUZZLES_PER_SECTION) {
      grouped.push(pool.slice(i, i + PUZZLES_PER_SECTION));
    }
    return grouped;
  };

  const activePool = activeMenu === 'sections' ? puzzlesWithMeta : longPuzzles;
  const sections = buildSections(activePool);

  const selectedSection = selectedSectionIndex !== null ? sections[selectedSectionIndex] || [] : [];
  const totalSections = sections.length;

  const sectionLabel = t('classic.section_label');
  const sectionRangeLabel = (index: number, poolSize: number) => {
    const start = index * PUZZLES_PER_SECTION + 1;
    const end = Math.min((index + 1) * PUZZLES_PER_SECTION, poolSize);
    return `${start}-${end}`;
  };

  const handleBack = () => {
    if (selectedSectionIndex !== null) {
      setSelectedSectionIndex(null);
      return;
    }
    onBack();
  };

  const topBarTitle = selectedSectionIndex !== null
    ? `${sectionLabel} ${selectedSectionIndex + 1}`
    : t('home.classic_title');

  return (
    <PageContainer>
      <TopBar 
        onThemeClick={() => {}} 
        onSettingsClick={() => {}}
        title={topBarTitle}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={handleBack} aria-label={t('common.back')} title={t('common.back')}>
            ←
          </button>
        }
      />

      {selectedSectionIndex === null && (
        <div className="classic-menu-tabs" role="tablist" aria-label={t('home.classic_title')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeMenu === 'sections'}
            className={`classic-menu-tab ${activeMenu === 'sections' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('sections');
              setSelectedSectionIndex(null);
            }}
          >
            {t('classic.tab_sections')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMenu === 'long'}
            className={`classic-menu-tab ${activeMenu === 'long' ? 'active' : ''}`}
            onClick={() => {
              setActiveMenu('long');
              setSelectedSectionIndex(null);
            }}
          >
            {t('classic.tab_long')}
          </button>
        </div>
      )}

      {selectedSectionIndex === null ? (
        <div className="classic-sections-grid">
          {sections.length === 0 && activeMenu === 'long' && (
            <div className="classic-empty-state">
              <p>{t('classic.no_long_puzzles')}</p>
            </div>
          )}
          {sections.map((sectionPuzzles, sectionIndex) => {
            const completedCount = sectionPuzzles.filter(
              (puzzle) => (puzzle.progress?.foundWords.length || 0) > 0
            ).length;

            return (
              <button
                key={`section-card-${sectionIndex + 1}`}
                className="classic-section-card"
                onClick={() => setSelectedSectionIndex(sectionIndex)}
              >
                <h2 className="classic-section-title">{sectionLabel} {sectionIndex + 1}</h2>
                <p className="classic-section-info">
                  {t('classic.heptagrams_label')} {sectionRangeLabel(sectionIndex, activePool.length)}
                </p>
                <p className="classic-section-info">{sectionPuzzles.length} {t('classic.puzzles_label')}</p>
                {activeMenu === 'long' && (
                  <p className="classic-section-info">{t('classic.long_hint')}</p>
                )}
                <p className="classic-section-progress">
                  {completedCount} / {sectionPuzzles.length} {t('classic.started_label')}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="classic-sections">
          <section className="classic-section" key={`section-${selectedSectionIndex + 1}`}>
            <h2 className="classic-section-title">
              {sectionLabel} {selectedSectionIndex + 1} / {totalSections}
            </h2>
            <div className="puzzles-grid-classic">
              {selectedSection.map((puzzle) => {
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
                          <span className="calculating">{t('classic.calculating')}</span>
                        ) : (
                          <span>📝 {puzzle.solutionCount} {t('classic.words')}</span>
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
                      {hasProgress ? t('classic.continue') : t('classic.play')}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </PageContainer>
  );
}
