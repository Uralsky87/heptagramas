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
  flushPendingWrites,
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
import { getEventPuzzleById, type EventPuzzle } from '../lib/specialPuzzles';
import { normalizeString } from '../lib/normalizeChar';

interface GameProps {
  initialPuzzle: Puzzle;
  dictionary: DictionaryData;
  allPuzzles: Puzzle[];
  onBack: () => void;
  mode: 'daily' | 'classic' | 'special';
  dailyProgressId?: string;
  dailyDateKey?: string;
  eventConfig?: EventPuzzle;
}

export default function Game({
  initialPuzzle,
  dictionary,
  allPuzzles,
  onBack,
  mode,
  dailyProgressId,
  dailyDateKey,
  eventConfig,
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
  const [eventExtraLetter, setEventExtraLetter] = useState<string | null>(null);
  // This marker belongs to the loaded snapshot, never to the selected puzzle.
  const [loadedProgress, setLoadedProgress] = useState<{ id: string; startedAt: string | null } | null>(null);
  const [hasProgressChanges, setHasProgressChanges] = useState(false);
  const [progressLoadError, setProgressLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
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
  const isProgressReady = loadedProgress?.id === progressId;
  const activeEventConfig = mode === 'special'
    ? eventConfig ?? getEventPuzzleById(progressId) ?? getEventPuzzleById(currentPuzzle.id)
    : null;
  const isThemedSpecial = Boolean(activeEventConfig && activeEventConfig.theme !== 'default');
  const eventThemeClass = isThemedSpecial && activeEventConfig ? `special-game-theme-${activeEventConfig.theme}` : '';
  const eventUnlockLetter = activeEventConfig?.unlockedExtraLetter ?? null;
  const isEventExtraLetterUnlocked = Boolean(eventUnlockLetter && eventExtraLetter === eventUnlockLetter);
  const isChristmasEvent = activeEventConfig?.theme === 'christmas';
  const isHalloweenEvent = activeEventConfig?.theme === 'halloween';
  const hasEventGift = isChristmasEvent || isHalloweenEvent;
  const eventRewardTitle = isHalloweenEvent ? 'Un regalo entre las sombras' : isChristmasEvent ? 'Regalo navideño' : 'Recompensa veraniega';
  const eventRewardOpenedTitle = isChristmasEvent || isHalloweenEvent ? 'Regalo abierto' : 'Recompensa desbloqueada';
  const eventRewardIcon = hasEventGift ? '🎁' : '☀️';
  const eventRewardOpenText = hasEventGift ? 'Abre el regalo' : 'Abre la recompensa';
  const eventRewardUnlockText = hasEventGift ? 'desbloquear el regalo' : 'desbloquear la recompensa';
  const activeEventExtraSolutions = [
    ...(activeEventConfig?.extraSolutions ?? []),
    ...(isEventExtraLetterUnlocked ? activeEventConfig?.unlockedExtraSolutions ?? [] : []),
  ];
  const activeAllowMissingCenterWords = [
    ...(activeEventConfig?.allowMissingCenterWords ?? []),
    ...(isEventExtraLetterUnlocked ? activeEventConfig?.unlockedAllowMissingCenterWords ?? [] : []),
  ];
  const activeHighlightedWords = [
    ...(activeEventConfig?.highlightedWords ?? []),
    ...(isEventExtraLetterUnlocked ? activeEventConfig?.unlockedHighlightedWords ?? [] : []),
  ];
  const giftUnlockThreshold = activeEventConfig?.unlockAtWordCount ?? null;
  const canOpenEventGift = Boolean(
    giftUnlockThreshold &&
    eventUnlockLetter &&
    !isEventExtraLetterUnlocked &&
    foundWords.length >= giftUnlockThreshold
  );
  const wordsUntilGift = giftUnlockThreshold
    ? Math.max(0, giftUnlockThreshold - foundWords.length)
    : 0;
  const displayedOuter = isEventExtraLetterUnlocked && eventUnlockLetter
    ? [...currentPuzzle.outer, eventUnlockLetter]
    : currentPuzzle.outer;
  const extraLetterIndices = isEventExtraLetterUnlocked && eventUnlockLetter
    ? new Set(shuffledOuter
      .map((letter, index) => (letter === eventUnlockLetter ? index : -1))
      .filter((index) => index >= 0))
    : undefined;

  useEffect(() => {
    setShuffledOuter(displayedOuter);
  }, [displayedOuter.join('')]);

  const puzzleSolutions = useMemo(() => {
    const minLen = currentPuzzle.minLen || 3;
    const allowEnye = currentPuzzle.allowEnye ?? true;
    const baseSolutions = solvePuzzle(currentPuzzle.center, currentPuzzle.outer, dictionary, minLen, allowEnye, eventExtraLetter ?? undefined);
    const extraSolutions = activeEventExtraSolutions;
    const solutions = extraSolutions.length > 0
      ? Array.from(new Set([...baseSolutions, ...extraSolutions])).sort((a, b) => a.localeCompare(b, 'es'))
      : baseSolutions;

    if (import.meta.env.DEV) {
      console.log(`[Game] Soluciones cargadas para ${currentPuzzle.id}:`, solutions.length, 'palabras');
    }

    return solutions;
  }, [activeEventExtraSolutions, currentPuzzle, dictionary, eventExtraLetter]);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        // A quick A → B → A must not read A before its last save finishes.
        await flushPendingWrites();
        if (cancelled) return;

        // A read failure must never enable saving an empty replacement.
        await preloadPuzzleProgress(progressId, { throwOnError: true });
        if (cancelled) return;

        const progress = loadPuzzleProgress(progressId);
        setFoundWords(progress?.foundWords ?? []);
        setScore(progress?.score ?? 0);
        setAchievements({ superHeptaWords: progress?.superHeptaWords ?? [] });
        setEventExtraLetter(progress?.exoticLetter ?? null);
        setClickedWord('');
        setHasProgressChanges(false);
        setProgressLoadError(null);
        setLoadedProgress({ id: progressId, startedAt: progress?.startedAt ?? null });
      } catch (error) {
        if (cancelled) return;
        console.error('[Game] No se pudo cargar el progreso:', error);
        setProgressLoadError('No se pudo cargar tu progreso. Reintenta para continuar.');
      }
    }

    void loadProgress();

    return () => { cancelled = true; };
  }, [loadAttempt, progressId]);

  const savePuzzleProgressState = useCallback(() => {
    if (!isProgressReady || !hasProgressChanges) return;

    const now = new Date().toISOString();
    const progress: PuzzleProgress = {
      foundWords,
      score,
      superHeptaWords: achievements.superHeptaWords,
      startedAt: loadedProgress.startedAt || loadPuzzleProgress(progressId)?.startedAt || now,
      lastPlayedAt: now,
      exoticLetter: eventExtraLetter ?? undefined,
    };
    savePuzzleProgress(progressId, progress);
  }, [achievements.superHeptaWords, eventExtraLetter, foundWords, hasProgressChanges, isProgressReady, loadedProgress, progressId, score]);

  useEffect(() => {
    if (foundWords.length > 0 || score > 0) {
      savePuzzleProgressState();
    }
  }, [eventExtraLetter, foundWords, savePuzzleProgressState, score]);

  const handleSelectPuzzle = (puzzle: Puzzle) => {
    savePuzzleProgressState();
    if (puzzle.id === currentPuzzle.id) return;
    setLoadedProgress(null);
    setProgressLoadError(null);
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

  const getWordDefinition = (word: string): string | null => {
    const normalized = normalizeString(word, currentPuzzle.allowEnye ?? true);
    return activeEventConfig?.customDefinitions?.[normalized] || getDefinition(word);
  };

  const handleAnswerClick = (word: string) => {
    const definition = getWordDefinition(word);
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

  const handleOpenEventGift = () => {
    if (!isProgressReady || !eventUnlockLetter || !canOpenEventGift) {
      return;
    }

    setEventExtraLetter(eventUnlockLetter);
    setHasProgressChanges(true);
    setMessage(`¡${eventRewardOpenedTitle}! Nueva letra: ${eventUnlockLetter.toUpperCase()}`);
    setMessageTone('success');
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
    if (!isProgressReady) return;

    const result = validateWord(
      word,
      currentPuzzle,
      foundWords,
      puzzleSolutions,
      eventExtraLetter,
      { allowMissingCenterWords: activeAllowMissingCenterWords }
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
    setHasProgressChanges(true);
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

  if (!isProgressReady) {
    return (
      <PageContainer>
        <div className="game-screen">
          <p role={progressLoadError ? 'alert' : 'status'}>
            {progressLoadError ?? 'Cargando tu progreso…'}
          </p>
          {progressLoadError && (
            <button className="btn-action" onClick={() => {
              setProgressLoadError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}>Reintentar</button>
          )}
          <button className="btn-action" onClick={onBack}>Volver</button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={isThemedSpecial ? `special-page-theme ${eventThemeClass}` : ''}>
      <div className={isThemedSpecial ? `game-screen special-game-theme ${eventThemeClass}` : 'game-screen'}>
      <TopBar
        onThemeClick={() => {}}
        onSettingsClick={() => {}}
        title={isHalloweenEvent ? 'Halloween' : mode === 'daily' ? t('common.daily') : mode === 'special' ? t('common.special') : t('home.classic_title')}
        rightButton={isHalloweenEvent ? <span className="halloween-top-star" aria-hidden="true">✧</span> : undefined}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={handleBackButton} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <header className="header game-header">
        {isHalloweenEvent && <p className="halloween-dates">26 OCT — 26 NOV</p>}
        <div className="game-header-row">
          <p className="puzzle-title">{currentPuzzle.title}</p>
          {mode === 'classic' && (
            <button className="btn-change-puzzle" onClick={() => setShowPuzzleSelector(true)}>
              📋 Cambiar
            </button>
          )}
        </div>
        {isHalloweenEvent && <p className="halloween-game-intro">Unas letras. Un pequeño misterio.</p>}
        {!isThemedSpecial && <><h2 className="base-game-title">Una palabra lleva a otra.</h2><p className="base-game-intro">Incluye siempre la letra central.</p></>}
      </header>

      <UnifiedFeedback signal={banner} onAnimationEnd={dismissBanner} />

      <HeptagramBoardSvg
        key={`${currentPuzzle.id}-${displayedOuter.join('')}`}
        ref={heptagramRef}
        center={currentPuzzle.center}
        outer={shuffledOuter}
        onLetterClick={handleLetterClick}
        successAnimation={successAnimation}
        onShuffleOuter={setShuffledOuter}
        variant={activeEventConfig?.theme ?? 'default'}
        extraLetterIndices={extraLetterIndices}
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

      {giftUnlockThreshold && eventUnlockLetter && (
        <section className={`event-gift-panel ${isEventExtraLetterUnlocked ? 'event-gift-panel-open' : ''}`}>
          <div className="event-gift-icon" aria-hidden="true">
            {isEventExtraLetterUnlocked ? eventUnlockLetter.toUpperCase() : eventRewardIcon}
          </div>
          <div className="event-gift-copy">
            <h2>{isEventExtraLetterUnlocked ? eventRewardOpenedTitle : eventRewardTitle}</h2>
            <p>
              {isEventExtraLetterUnlocked
                ? `La letra ${eventUnlockLetter.toUpperCase()} se queda desbloqueada para esta partida.`
                : canOpenEventGift
                  ? `Has llegado a ${giftUnlockThreshold} palabras. ${eventRewardOpenText} para añadir la letra ${eventUnlockLetter.toUpperCase()}.`
                  : `Encuentra ${wordsUntilGift} palabras más para ${eventRewardUnlockText}.`}
            </p>
          </div>
          {canOpenEventGift && (
            <button className="event-gift-button" onClick={handleOpenEventGift}>
              {hasEventGift ? 'Abrir regalo' : 'Abrir recompensa'}
            </button>
          )}
        </section>
      )}

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
                        title={getWordDefinition(word) ? 'Haz clic para ver la definición' : ''}
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

      {selectedAnswerWord && getWordDefinition(selectedAnswerWord) && (
        <DefinitionModal
          word={selectedAnswerWord}
          definition={getWordDefinition(selectedAnswerWord) as string}
          isOpen={true}
          onClose={() => setSelectedAnswerWord(null)}
        />
      )}

      <FoundWordsList
        words={foundWords}
        total={puzzleSolutions.length}
        superHeptaWords={achievements.superHeptaWords}
        customDefinitions={activeEventConfig?.customDefinitions}
        highlightedWords={activeHighlightedWords}
      />

      {isThemedSpecial ? <PuzzleStats
        letters={[...displayedOuter, currentPuzzle.center]}
        solutions={puzzleSolutions}
        foundWords={foundWords}
        specialMissingCenterWord={activeAllowMissingCenterWords[0]}
      /> : <details className="base-stats"><summary><span>El puzzle en detalle</span><span className="base-stats-toggle" aria-hidden="true">+</span></summary><PuzzleStats letters={[...displayedOuter, currentPuzzle.center]} solutions={puzzleSolutions} foundWords={foundWords} /></details>}

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
