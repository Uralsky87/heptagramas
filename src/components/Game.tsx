import { useState, useEffect, useRef } from 'react';
import HeptagramBoardSvg, { type HeptagramBoardHandle } from './HeptagramBoardSvg';
import WordInput from './WordInput';
import FoundWordsList from './FoundWordsList';
import PuzzleStats from './PuzzleStats';
import PuzzleSelector from './PuzzleSelector';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import CorrectFeedback from './CorrectFeedback';
import IncorrectFeedback from './IncorrectFeedback';
import AlreadyFoundFeedback from './AlreadyFoundFeedback';
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
import { calculateSessionXP, checkLevelUp, calculateLevel } from '../lib/xpSystem';
import { checkThemeUnlock } from '../lib/themes';

interface GameProps {
  initialPuzzle: Puzzle;
  dictionary: DictionaryData;
  allPuzzles: Puzzle[];
  onBack: () => void;
  mode: 'daily' | 'classic';
  dailyProgressId?: string; // Para modo diario: "daily-YYYY-MM-DD"
}

export default function Game({ initialPuzzle, dictionary, allPuzzles, onBack, mode, dailyProgressId }: GameProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(initialPuzzle);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [achievements, setAchievements] = useState({ superHeptaWords: [] as string[] });
  const [message, setMessage] = useState<string>('');
  const [clickedWord, setClickedWord] = useState('');
  const [puzzleSolutions, setPuzzleSolutions] = useState<string[]>([]);
  const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
  const [showXPReward, setShowXPReward] = useState(false);
  const [xpRewardInfo, setXPRewardInfo] = useState<{
    xpGained: number;
    levelUp: boolean;
    newLevel: number;
    unlockedThemeName?: string;
  } | null>(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [showIncorrectAnim, setShowIncorrectAnim] = useState(false);
  const [showAlreadyFoundAnim, setShowAlreadyFoundAnim] = useState(false);
  const [shuffledOuter, setShuffledOuter] = useState<string[]>(initialPuzzle.outer);
  const heptagramRef = useRef<HeptagramBoardHandle>(null);

  // Determinar ID de progreso: usar dailyProgressId si está en modo diario, sino puzzleId
  const progressId = mode === 'daily' && dailyProgressId ? dailyProgressId : currentPuzzle.id;

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
    awardSessionXP(); // Otorgar XP al cambiar de puzzle
    setCurrentPuzzle(puzzle);
  };

  // Otorgar XP por la sesión actual
  const awardSessionXP = () => {
    if (foundWords.length === 0) return; // No otorgar XP si no se jugó
    
    const xpReward = calculateSessionXP(
      foundWords.length,
      puzzleSolutions.length,
      achievements.superHeptaWords.length,
      mode
    );
    
    if (xpReward.total === 0) return;
    
    const playerState = loadPlayerState();
    const oldXP = playerState.xpTotal;
    const newXP = oldXP + xpReward.total;
    
    playerState.xpTotal = newXP;
    playerState.level = calculateLevel(newXP);
    savePlayerState(playerState);
    
    const levelUpInfo = checkLevelUp(oldXP, newXP);
    
    // Mostrar notificación de XP (incluye tema desbloqueado si aplicable)
    const unlockedTheme = levelUpInfo.leveledUp ? checkThemeUnlock(levelUpInfo.newLevel) : null;
    
    setXPRewardInfo({
      xpGained: xpReward.total,
      levelUp: levelUpInfo.leveledUp,
      newLevel: levelUpInfo.newLevel,
      unlockedThemeName: unlockedTheme?.name,
    });
    setShowXPReward(true);
    
    if (import.meta.env.DEV) {
      console.log('[Game] XP otorgada:', xpReward);
      console.log('[Game] Nivel:', levelUpInfo);
    }
  };

  // Manejar timeout de XP reward (evitar memory leak)
  useEffect(() => {
    if (!showXPReward) return;
    
    const timer = setTimeout(() => {
      setShowXPReward(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [showXPReward]);

  const handleBackButton = () => {
    savePuzzleProgressState();
    awardSessionXP(); // Otorgar XP al salir
    onBack();
  };

  const handleLetterClick = (letter: string) => {
    setClickedWord(prev => prev + letter.toLowerCase());
  };

  const handleClearClicked = () => {
    setClickedWord('');
  };

  const handleBackspace = () => {
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
      
      // Mostrar feedback específico para palabra ya encontrada
      if (result.reason === 'Ya la encontraste.') {
        setShowAlreadyFoundAnim(true);
      } else {
        setShowIncorrectAnim(true);
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
    
    const isSH = isSuperHepta(normalized, currentPuzzle);
    
    // Reproducir sonido si está habilitado
    const playerState = loadPlayerState();
    if (playerState.settings.soundEnabled) {
      if (isSH) {
        playSuperHeptaSound();
      } else {
        playSuccessSound();
      }
    }
    
    // Mostrar animación de éxito
    setShowSuccessAnim(true);
    
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
      />

      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-back" onClick={handleBackButton}>
            ← Inicio
          </button>
          <div style={{ width: '70px' }} />
        </div>
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
      {showXPReward && xpRewardInfo && (
        <div className="xp-notification">
          <div className="xp-notification-content">
            <div className="xp-amount">+{xpRewardInfo.xpGained} XP</div>
            {xpRewardInfo.levelUp && (
              <div className="xp-level-up">
                🎉 ¡Nivel {xpRewardInfo.newLevel}! 🎉
              </div>
            )}
          </div>
        </div>
      )}

      <HeptagramBoardSvg 
        ref={heptagramRef}
        center={currentPuzzle.center} 
        outer={shuffledOuter}
        onLetterClick={handleLetterClick}
        successAnimation={showSuccessAnim}
        onShuffleOuter={setShuffledOuter}
      />

      <CorrectFeedback 
        isVisible={showSuccessAnim}
        onAnimationEnd={() => setShowSuccessAnim(false)}
      />

      <IncorrectFeedback 
        isVisible={showIncorrectAnim}
        onAnimationEnd={() => setShowIncorrectAnim(false)}
      />

      <AlreadyFoundFeedback 
        isVisible={showAlreadyFoundAnim}
        onAnimationEnd={() => setShowAlreadyFoundAnim(false)}
      />

      <WordInput 
        onSubmit={handleSubmit} 
        message={message}
        clickedWord={clickedWord}
        onClearClicked={handleClearClicked}
        onBackspace={handleBackspace}
        onShuffle={() => heptagramRef.current?.shuffle()}
        successAnimation={showSuccessAnim}
      />

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

      {showXPReward && xpRewardInfo && (
        <div className="xp-notification">
          <div className="xp-content">
            <div className="xp-amount">+{xpRewardInfo.xpGained} XP</div>
            {xpRewardInfo.levelUp && (
              <>
                <div className="level-up-text">¡Nivel {xpRewardInfo.newLevel}!</div>
                {xpRewardInfo.unlockedThemeName && (
                  <div className="theme-unlocked">🎨 Tema desbloqueado: {xpRewardInfo.unlockedThemeName}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
