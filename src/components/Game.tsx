import { useState, useEffect, useRef } from 'react';
import HeptagramBoardSvg, { type HeptagramBoardHandle } from './HeptagramBoardSvg';
import WordInput from './WordInput';
import FoundWordsList from './FoundWordsList';
import PuzzleStats from './PuzzleStats';
import PuzzleSelector from './PuzzleSelector';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import UnifiedFeedback, { type FeedbackType } from './UnifiedFeedback';
import type { Puzzle, PuzzleProgress } from '../types';
import { validateWord, isSuperHepta } from '../lib/validateWord';
import { normalizeWord } from '../lib/normalizeWord';
import { playSuccessSound, playSuperHeptaSound } from '../lib/soundEffects';
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
import { useLanguage } from '../contexts/LanguageContext';

interface GameProps {
  initialPuzzle: Puzzle;
  dictionary: DictionaryData;
  allPuzzles: Puzzle[];
  onBack: () => void;
  mode: 'daily' | 'classic';
  dailyProgressId?: string; // Para modo diario: "daily-YYYY-MM-DD"
  dailyDateKey?: string; // Para modo diario: "YYYY-MM-DD"
}

export default function Game({ initialPuzzle, dictionary, allPuzzles, onBack, mode, dailyProgressId, dailyDateKey }: GameProps) {
  const { t } = useLanguage();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(initialPuzzle);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [achievements, setAchievements] = useState({ superHeptaWords: [] as string[] });
  const [message, setMessage] = useState<string>('');
  const [clickedWord, setClickedWord] = useState('');
  const [puzzleSolutions, setPuzzleSolutions] = useState<string[]>([]);
  const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [shuffledOuter, setShuffledOuter] = useState<string[]>(initialPuzzle.outer);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedAnswerWord, setSelectedAnswerWord] = useState<string | null>(null);
  const heptagramRef = useRef<HeptagramBoardHandle>(null);
  const { getDefinition } = useDefinitions();

  // Determinar ID de progreso: usar dailyProgressId si está en modo diario, sino puzzleId
  const progressId = mode === 'daily' && dailyProgressId ? dailyProgressId : currentPuzzle.id;
  const latestProgressIdRef = useRef(progressId);

  useEffect(() => {
    latestProgressIdRef.current = progressId;
  }, [progressId]);

  // Calcular soluciones cuando cambia el puzzle
  useEffect(() => {
    const minLen = currentPuzzle.minLen || 3;
    const allowEnye = currentPuzzle.allowEnye ?? true;
    const solutions = solvePuzzle(
      currentPuzzle.center, 
      currentPuzzle.outer, 
      dictionary,
      minLen,
      allowEnye
    );
    setPuzzleSolutions(solutions);
    
    // Log en desarrollo
    if (import.meta.env.DEV) {
      console.log(
        `[Game] Soluciones cargadas para ${currentPuzzle.id}:`,
        solutions.length,
        'palabras'
      );
    }
  }, [currentPuzzle, dictionary]);

  // Cargar progreso al iniciar o cambiar puzzle
  useEffect(() => {
    loadPuzzleProgressState(progressId);
  }, [progressId]);

  // Cargar progreso de un puzzle
  const loadPuzzleProgressState = async (progressIdToLoad: string) => {
    // Precargar del IndexedDB al cache
    await preloadPuzzleProgress(progressIdToLoad);

    // Evitar race condition si el puzzle cambió durante la carga
    if (progressIdToLoad !== latestProgressIdRef.current) {
      return;
    }
    
    // Ahora leer del cache (sync)
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
  };

  // Guardar progreso del puzzle actual
  const savePuzzleProgressState = () => {
    const now = new Date().toISOString();
    const progress: PuzzleProgress = {
      foundWords,
      score,
      superHeptaWords: achievements.superHeptaWords,
      startedAt: loadPuzzleProgress(progressId)?.startedAt || now,
      lastPlayedAt: now,
    };
    savePuzzleProgress(progressId, progress);
  };

  // Guardar progreso automáticamente cuando cambia
  useEffect(() => {
    if (foundWords.length > 0 || score > 0) {
      savePuzzleProgressState();
    }
  }, [foundWords, score, achievements, progressId]);

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
    setFeedbackType(null);
    setClickedWord(prev => prev + letter.toLowerCase());
  };

  const handleBackspace = () => {
    setFeedbackType(null);
    setClickedWord(prev => prev.slice(0, -1));
  };

  const handleDeleteLetter = () => {
    setFeedbackType(null);
    setClickedWord(prev => prev.slice(0, -1));
  };

  // Limpiar mensaje después de 3 segundos (evitar memory leak)
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleSubmit = (word: string) => {
    const result = validateWord(word, currentPuzzle, foundWords, puzzleSolutions);

    if (!result.ok) {
      setMessage(result.reason || 'Error desconocido');
      setClickedWord('');

      // Mostrar feedback específico
      if (result.reason === 'Ya la encontraste.') {
        setFeedbackType('already-found');
      } else if (result.reason?.includes('Debe contener la letra central')) {
        setFeedbackType('missing-central');
      } else {
        setFeedbackType('incorrect');
      }
      
      // Log en desarrollo para debugging
      if (import.meta.env.DEV) {
        console.log(
          `[Game] Palabra rechazada: "${word}"`,
          `\nRazón: ${result.reason}`,
          `\nNormalizada: ${word.toLowerCase()}`,
          `\nSoluciones disponibles: ${puzzleSolutions.length}`
        );
      }
      return;
    }

    const normalized = normalizeWord(word);
    setFoundWords((prev) => [...prev, normalized].sort());
    setClickedWord('');

    // XP por palabra: 1 XP por letra (diario y clasico)
    const wordXP = normalized.length;
    const playerState = loadPlayerState();
    const oldXP = playerState.xpTotal;
    const newXP = oldXP + wordXP;
    playerState.xpTotal = newXP;
    playerState.level = calculateLevel(newXP);
    savePlayerState(playerState);
    
    
    const isSH = isSuperHepta(normalized, currentPuzzle);
    
    // Reproducir sonido si está habilitado
    if (playerState.settings.soundEnabled) {
      if (isSH) {
        playSuperHeptaSound();
      } else {
        playSuccessSound();
      }
    }
    
    // Mostrar animación de éxito
    setShowSuccessAnim(true);
    setFeedbackType('correct');
    
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
  };

  // Limpiar animación de éxito
  useEffect(() => {
    if (!showSuccessAnim) return;
    
    const timer = setTimeout(() => setShowSuccessAnim(false), 600);
    return () => clearTimeout(timer);
  }, [showSuccessAnim]);

  return (
    <PageContainer>
      <TopBar 
        onThemeClick={() => {}} 
        onSettingsClick={() => {}}
        title={mode === 'daily' ? t('common.daily') : t('home.classic_title')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={handleBackButton}>
            {t('common.home')}
          </button>
        }
      />

      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <p className="puzzle-title">{currentPuzzle.title}</p>
          {mode === 'classic' && (
            <button 
              className="btn-change-puzzle"
              onClick={() => setShowPuzzleSelector(true)}
            >
              📋 Cambiar
            </button>
          )}
        </div>
      </header>

      {/* Notificación de XP */}
      {/* Mensajes de feedback encima del heptagrama */}
      <UnifiedFeedback 
        type={feedbackType}
        onAnimationEnd={() => {
          setFeedbackType(null);
        }}
      />

      <HeptagramBoardSvg 
        ref={heptagramRef}
        center={currentPuzzle.center} 
        outer={shuffledOuter}
        onLetterClick={handleLetterClick}
        successAnimation={showSuccessAnim}
        onShuffleOuter={setShuffledOuter}
      />

      <WordInput 
        onSubmit={handleSubmit} 
        message={message}
        clickedWord={clickedWord}
        onBackspace={handleBackspace}
        onDeleteLetter={handleDeleteLetter}
        onShuffle={() => heptagramRef.current?.shuffle()}
        successAnimation={showSuccessAnim}
      />

      {isPastDaily && (
        <div className="answers-section">
          <button
            className="btn-action btn-answers"
            onClick={() => setShowAnswers((prev) => !prev)}
          >
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
      />

      <PuzzleStats 
        letters={[...currentPuzzle.outer, currentPuzzle.center]}
        solutions={puzzleSolutions}
        foundWords={foundWords}
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

    </PageContainer>
  );
}
