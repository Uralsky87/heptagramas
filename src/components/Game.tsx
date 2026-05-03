import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HeptagramBoardSvg, { type HeptagramBoardHandle } from './HeptagramBoardSvg';
import WordInput from './WordInput';
import FoundWordsList from './FoundWordsList';
import PuzzleStats from './PuzzleStats';
import PuzzleSelector from './PuzzleSelector';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import BackChevronIcon from './icons/BackChevronIcon';
import UnifiedFeedback from './UnifiedFeedback';
import type { Puzzle, PuzzleProgress } from '../types';
import { validateWord, isSuperHepta } from '../lib/validateWord';
import { normalizeWord } from '../lib/normalizeWord';
import {
  loadPuzzleProgress,
  savePuzzleProgress,
  preloadPuzzleProgress,
  loadPlayerState,
  savePlayerState,
} from '../lib/storageAdapter';
import { type DictionaryData } from '../lib/dictionary';
import { solvePuzzle } from '../lib/solvePuzzle';
import { calculateLevel } from '../lib/xpSystem';
import { getDailyKey } from '../lib/dailySession';
import DefinitionModal from './DefinitionModal';
import { useDefinitions } from '../lib/useDefinitions';
import { useLanguage } from '../contexts/useLanguage';
import type { FeedbackTone } from '../lib/feedback';
import { buildSuccessFeedbackIntent, buildValidationFeedbackIntent } from '../lib/feedback';
import useSubmissionFeedback from '../lib/useSubmissionFeedback';
import {
  MOTHERS_DAY_ALLOW_MISSING_CENTER,
  MOTHERS_DAY_DEFINITIONS,
  MOTHERS_DAY_EXTRA_SOLUTIONS,
  MOTHERS_DAY_HIGHLIGHT_WORDS,
  MOTHERS_DAY_PROGRESS_ID,
} from '../lib/specialPuzzles';

interface GameProps {
  initialPuzzle: Puzzle;
  dictionary: DictionaryData;
  allPuzzles: Puzzle[];
  onBack: () => void;
  mode: 'daily' | 'classic' | 'special';
  dailyProgressId?: string;
  dailyDateKey?: string;
}

export default function Game({
  initialPuzzle,
  dictionary,
  allPuzzles,
  onBack,
  mode,
  dailyProgressId,
  dailyDateKey,
}: GameProps) {
  const { t } = useLanguage();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(initialPuzzle);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [achievements, setAchievements] = useState({ superHeptaWords: [] as string[] });
  const [message, setMessage] = useState<string>('');
  const [messageTone, setMessageTone] = useState<FeedbackTone>('neutral');
  const [clickedWord, setClickedWord] = useState('');
  const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
  const [shuffledOuter, setShuffledOuter] = useState<string[]>(initialPuzzle.outer);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswerWord, setSelectedAnswerWord] = useState<string | null>(null);
  const heptagramRef = useRef<HeptagramBoardHandle>(null);
  const { getDefinition } = useDefinitions();
  const {
    banner,
    dismissBanner,
    errorAnimation,
    feedbackTone,
    resetFeedbackTone,
    submitPulseTone,
    successAnimation,
    triggerFeedback,
  } = useSubmissionFeedback();

  const progressId = dailyProgressId ?? currentPuzzle.id;
  const latestProgressIdRef = useRef(progressId);
  const isMothersDaySpecial = mode === 'special' && currentPuzzle.id === MOTHERS_DAY_PROGRESS_ID;

  useEffect(() => {
    latestProgressIdRef.current = progressId;
  }, [progressId]);

  const puzzleSolutions = useMemo(() => {
    const minLen = currentPuzzle.minLen || 3;
    const allowEnye = currentPuzzle.allowEnye ?? true;
    const baseSolutions = solvePuzzle(currentPuzzle.center, currentPuzzle.outer, dictionary, minLen, allowEnye);
    const solutions = isMothersDaySpecial
      ? Array.from(new Set([...baseSolutions, ...MOTHERS_DAY_EXTRA_SOLUTIONS])).sort((a, b) => a.localeCompare(b, 'es'))
      : baseSolutions;

    if (import.meta.env.DEV) {
      console.log(`[Game] Soluciones cargadas para ${currentPuzzle.id}:`, solutions.length, 'palabras');
    }

    return solutions;
  }, [currentPuzzle, dictionary, isMothersDaySpecial]);

  const loadPuzzleProgressState = useCallback(async (progressIdToLoad: string) => {
    await preloadPuzzleProgress(progressIdToLoad);

    if (progressIdToLoad !== latestProgressIdRef.current) {
      return;
    }

    const progress = loadPuzzleProgress(progressIdToLoad);
    if (progress) {
      setFoundWords(progress.foundWords);
      setScore(progress.score);
      setAchievements({ superHeptaWords: progress.superHeptaWords });
    } else {
      setFoundWords([]);
      setScore(0);
      setAchievements({ superHeptaWords: [] });
    }
    setClickedWord('');
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadPuzzleProgressState(progressId);
    }, 0);

    return () => clearTimeout(timerId);
  }, [loadPuzzleProgressState, progressId]);

  const savePuzzleProgressState = useCallback(() => {
    const now = new Date().toISOString();
    const progress: PuzzleProgress = {
      foundWords,
      score,
      superHeptaWords: achievements.superHeptaWords,
      startedAt: loadPuzzleProgress(progressId)?.startedAt || now,
      lastPlayedAt: now,
    };
    savePuzzleProgress(progressId, progress);
  }, [achievements.superHeptaWords, foundWords, progressId, score]);

  useEffect(() => {
    if (foundWords.length > 0 || score > 0) {
      savePuzzleProgressState();
    }
  }, [foundWords, savePuzzleProgressState, score]);

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    savePuzzleProgressState();
    setCurrentPuzzle(puzzle);
  };

  const handleBackButton = () => {
    savePuzzleProgressState();
    onBack();
  };

  const isPastDaily =
    mode === 'daily' &&
    typeof dailyDateKey === 'string' &&
    dailyDateKey < getDailyKey();

  const solutionsByLength = puzzleSolutions.reduce<Record<number, string[]>>((acc, word) => {
    const length = word.length;
    if (!acc[length]) {
      acc[length] = [];
    }
    acc[length].push(word);
    return acc;
  }, {});

  const sortedLengths = Object.keys(solutionsByLength)
    .map(Number)
    .sort((a, b) => a - b);

  sortedLengths.forEach((length) => {
    solutionsByLength[length].sort((a, b) => a.localeCompare(b, 'es'));
  });

  const renderWordWithCenter = (word: string, center: string) => {
    const centerLower = center.toLowerCase();
    return word.split('').map((char, index) =>
      char.toLowerCase() === centerLower ? (
        <strong key={`${word}-${index}`}>{char}</strong>
      ) : (
        <span key={`${word}-${index}`}>{char}</span>
      )
    );
  };

  const handleAnswerClick = (word: string) => {
    const definition = getDefinition(word);
    if (definition) {
      setSelectedAnswerWord(word);
    }
  };

  const handleLetterClick = (letter: string) => {
    dismissBanner();
    setClickedWord((prev) => prev + letter.toLowerCase());
  };

  const handleBackspace = () => {
    dismissBanner();
    setClickedWord((prev) => prev.slice(0, -1));
  };

  const handleDeleteLetter = () => {
    dismissBanner();
    setClickedWord((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage('');
      setMessageTone('neutral');
      resetFeedbackTone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message, resetFeedbackTone]);

  const handleSubmit = (word: string) => {
    const result = validateWord(
      word,
      currentPuzzle,
      foundWords,
      puzzleSolutions,
      null,
      { allowMissingCenterWords: isMothersDaySpecial ? MOTHERS_DAY_ALLOW_MISSING_CENTER : [] }
    );
    const playerState = loadPlayerState();

    if (!result.ok) {
      const feedbackIntent = buildValidationFeedbackIntent(result, t);
      setMessage(result.reason || 'Error desconocido');
      setMessageTone(feedbackIntent.detailTone);
      triggerFeedback(feedbackIntent, { soundEnabled: playerState.settings.soundEnabled });
      setClickedWord('');

      if (import.meta.env.DEV) {
        console.log(
          `[Game] Palabra rechazada: "${word}"`,
          `\nRazon: ${result.reason}`,
          `\nNormalizada: ${word.toLowerCase()}`,
          `\nSoluciones disponibles: ${puzzleSolutions.length}`
        );
      }
      return;
    }

    const normalized = normalizeWord(word);
    setFoundWords((prev) => [...prev, normalized].sort());
    setClickedWord('');

    const wordXP = normalized.length;
    const oldXP = playerState.xpTotal;
    const newXP = oldXP + wordXP;
    playerState.xpTotal = newXP;
    playerState.level = calculateLevel(newXP);
    savePlayerState(playerState);

    const isSH = isSuperHepta(normalized, currentPuzzle);

    if (isSH) {
      setAchievements((prev) => {
        if (!prev.superHeptaWords.includes(normalized)) {
          return { superHeptaWords: [...prev.superHeptaWords, normalized] };
        }
        return prev;
      });
      setMessage('¡SuperHepta! 🌟 ¡Usaste todas las letras!');
    } else {
      setMessage('¡Bien! ✓');
    }

    const successIntent = buildSuccessFeedbackIntent(isSH ? 'superhepta' : 'correct');
    setMessageTone(successIntent.detailTone);
    triggerFeedback(successIntent, { soundEnabled: playerState.settings.soundEnabled });
  };

  return (
    <PageContainer className={isMothersDaySpecial ? 'special-page-theme' : ''}>
      <div className={isMothersDaySpecial ? 'game-screen special-game-theme' : 'game-screen'}>
      <TopBar
        onThemeClick={() => {}}
        onSettingsClick={() => {}}
        title={mode === 'daily' ? t('common.daily') : mode === 'special' ? t('common.special') : t('home.classic_title')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={handleBackButton} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <header className="header game-header">
        <div className="game-header-row">
          <p className="puzzle-title">{currentPuzzle.title}</p>
          {mode === 'classic' && (
            <button className="btn-change-puzzle" onClick={() => setShowPuzzleSelector(true)}>
              📋 Cambiar
            </button>
          )}
        </div>
      </header>

      <UnifiedFeedback signal={banner} onAnimationEnd={dismissBanner} />

      <HeptagramBoardSvg
        ref={heptagramRef}
        center={currentPuzzle.center}
        outer={shuffledOuter}
        onLetterClick={handleLetterClick}
        successAnimation={successAnimation}
        onShuffleOuter={setShuffledOuter}
        variant={isMothersDaySpecial ? 'mothers-day' : 'default'}
      />

      <WordInput
        onSubmit={handleSubmit}
        message={message}
        messageTone={messageTone === 'neutral' ? feedbackTone : messageTone}
        clickedWord={clickedWord}
        onBackspace={handleBackspace}
        onDeleteLetter={handleDeleteLetter}
        onShuffle={() => heptagramRef.current?.shuffle()}
        successAnimation={successAnimation}
        errorAnimation={errorAnimation}
        submitPulseTone={submitPulseTone}
      />

      {isPastDaily && (
        <div className="answers-section">
          <button className="btn-action btn-answers" onClick={() => setShowAnswers((prev) => !prev)}>
            {showAnswers ? 'Ocultar respuestas' : 'Ver respuestas'}
          </button>

          {showAnswers && (
            <div className="answers-list">
              {sortedLengths.map((length) => (
                <div key={length} className="answers-group">
                  <div className="answers-group-title">{length} letras</div>
                  <div className="answers-words">
                    {solutionsByLength[length].map((word) => (
                      <span
                        key={word}
                        className="answers-word"
                        onClick={() => handleAnswerClick(word)}
                        title={getDefinition(word) ? 'Haz clic para ver la definición' : ''}
                      >
                        {renderWordWithCenter(word, currentPuzzle.center)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedAnswerWord && getDefinition(selectedAnswerWord) && (
        <DefinitionModal
          word={selectedAnswerWord}
          definition={getDefinition(selectedAnswerWord) as string}
          isOpen={true}
          onClose={() => setSelectedAnswerWord(null)}
        />
      )}

      <FoundWordsList
        words={foundWords}
        total={puzzleSolutions.length}
        superHeptaWords={achievements.superHeptaWords}
        customDefinitions={isMothersDaySpecial ? MOTHERS_DAY_DEFINITIONS : undefined}
        highlightedWords={isMothersDaySpecial ? MOTHERS_DAY_HIGHLIGHT_WORDS : undefined}
      />

      <PuzzleStats
        letters={[...currentPuzzle.outer, currentPuzzle.center]}
        solutions={puzzleSolutions}
        foundWords={foundWords}
        specialMissingCenterWord={isMothersDaySpecial ? MOTHERS_DAY_ALLOW_MISSING_CENTER[0] : undefined}
      />

      {showPuzzleSelector && mode === 'classic' && (
        <PuzzleSelector
          puzzles={allPuzzles}
          currentPuzzleId={currentPuzzle.id}
          onSelectPuzzle={handleSelectPuzzle}
          onSelectDaily={() => {}}
          onClose={() => setShowPuzzleSelector(false)}
        />
      )}
      </div>
    </PageContainer>
  );
}
