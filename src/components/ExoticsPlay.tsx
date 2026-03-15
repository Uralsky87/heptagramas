import { useState, useEffect, useRef } from 'react';
import HeptagramBoardSvg, { type HeptagramBoardHandle } from './HeptagramBoardSvg';
import WordInput from './WordInput';
import FoundWordsList from './FoundWordsList';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import UnifiedFeedback, { type FeedbackType } from './UnifiedFeedback';
import type { ValidationResult, ExoticsRunState } from '../types';
import { normalizeWord } from '../lib/normalizeWord';
import { normalizeChar } from '../lib/normalizeChar';
import { playSuccessSound, playSuperHeptaSound } from '../lib/soundEffects';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { loadExoticsRun, saveExoticsRun, clearExoticsRun } from '../lib/exoticsStorage';
import { solvePuzzle } from '../lib/solvePuzzle';
import { generateExoticPuzzle } from '../lib/generateExoticPuzzle';
import { calculateLevel } from '../lib/xpSystem';
import type { DictionaryData } from '../lib/dictionary';
import { useLanguage } from '../contexts/LanguageContext';
import '../exotics-styles.css';

interface ExoticsPlayProps {
  onBack: () => void;
  dictionary: DictionaryData;
}

// Función determinista de shuffle usando seed
function shuffleArray(array: string[], seed: number): string[] {
  const result = [...array];
  let currentSeed = seed;
  
  // Simple LCG (Linear Congruential Generator) para pseudo-random determinista
  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  // Fisher-Yates shuffle con seed
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

export default function ExoticsPlay({ onBack, dictionary }: ExoticsPlayProps) {
  const { t } = useLanguage();
  const [runState, setRunState] = useState<ExoticsRunState | null>(null);
  const [message, setMessage] = useState<string>('');
  const [clickedWord, setClickedWord] = useState('');
  const [puzzleSolutions, setPuzzleSolutions] = useState<string[]>([]);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [isFeedbackActive, setIsFeedbackActive] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0); // Solo guardamos un seed para shuffle
  const [, setIsGeneratingNewPuzzle] = useState(false);
  const [, setGenerationProgress] = useState({ attempts: 0, lastCount: 0 });
  const [showAbilitiesPanel, setShowAbilitiesPanel] = useState(false);
  const [showLetterSelector, setShowLetterSelector] = useState(false);
  const [letterSelectorMode, setLetterSelectorMode] = useState<'swap' | 'buy' | null>(null);
  const [, setIsCalculatingSolutions] = useState(false);
  const [abilityFlow, setAbilityFlow] = useState<{
    type: 'swap-random' | 'swap-concrete' | null;
    selectedOuterIndex: number | null;
  }>({ type: null, selectedOuterIndex: null });
  const heptagramRef = useRef<HeptagramBoardHandle>(null);
  const solutionsCacheRef = useRef<Map<string, string[]>>(new Map());
  const timeoutsRef = useRef<number[]>([]);

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };
  }, []);

  // ============================================
  // TABLERO DINÁMICO: combinar outer + extraLetters
  // ============================================
  
  // Combinar outer base + extra letters para el tablero
  const outerCombined = runState ? [...runState.puzzle.outer, ...runState.extraLetters] : [];
  
  // Derivar shuffledOuter del outerCombined usando shuffleSeed
  const shuffledOuter = runState ? shuffleArray(outerCombined, shuffleSeed) : [];
  
  // Calcular índices de letras extra en shuffledOuter (para marcarlas visualmente)
  const extraLetterIndices = new Set<number>();
  if (runState && runState.extraLetters.length > 0) {
    const counts = new Map<string, number>();
    runState.extraLetters.forEach(letter => {
      const key = letter.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    shuffledOuter.forEach((letter, index) => {
      const key = letter.toLowerCase();
      const remaining = counts.get(key);
      if (remaining && remaining > 0) {
        extraLetterIndices.add(index);
        if (remaining === 1) {
          counts.delete(key);
        } else {
          counts.set(key, remaining - 1);
        }
      }
    });
  }
  // ============================================

  // Cargar run state al montar
  useEffect(() => {
    const run = loadExoticsRun();
    if (!run) {
      alert(t('exotic.no_active_run_returning'));
      onBack();
      return;
    }
    
    setRunState(run);
    
    if (import.meta.env.DEV) {
      console.log('[ExoticsPlay] Run cargada:', run.runId);
    }
  }, [onBack]);

  // Calcular soluciones cuando cambia el run state o las letras extra (con caché)
  useEffect(() => {
    if (!runState) return;
    
    // Crear clave de caché
    const allOuterLetters = [...runState.puzzle.outer, ...runState.extraLetters];
    const cacheKey = `${runState.puzzle.center}:${allOuterLetters.sort().join('')}`;
    
    // Verificar caché primero
    const cachedSolutions = solutionsCacheRef.current.get(cacheKey);
    if (cachedSolutions) {
      setPuzzleSolutions(cachedSolutions);
      
      if (runState.solutionsTotal !== cachedSolutions.length) {
        const updatedRun = { ...runState, solutionsTotal: cachedSolutions.length };
        setRunState(updatedRun);
        saveExoticsRun(updatedRun);
      }
      
      if (import.meta.env.DEV) {
        console.log(`[ExoticsPlay] Soluciones desde caché:`, cachedSolutions.length);
      }
      return;
    }
    
    // Si no está en caché, calcular con timeout para mostrar loading
    setIsCalculatingSolutions(true);
    
    const timer = scheduleTimeout(() => {
      const solutions = solvePuzzle(
        runState.puzzle.center,
        allOuterLetters,
        dictionary,
        3,
        false
      );
      
      // Guardar en caché
      solutionsCacheRef.current.set(cacheKey, solutions);
      setPuzzleSolutions(solutions);
      setIsCalculatingSolutions(false);
      
      if (runState.solutionsTotal !== solutions.length) {
        const updatedRun = { ...runState, solutionsTotal: solutions.length };
        setRunState(updatedRun);
        saveExoticsRun(updatedRun);
      }
      
      if (import.meta.env.DEV) {
        console.log(
          `[ExoticsPlay] Soluciones calculadas:`,
          solutions.length,
          `con letras extra:`,
          runState.extraLetters
        );
      }
    }, 10); // Pequeño delay para permitir que se muestre el loading
    
    return () => clearTimeout(timer);
  }, [runState?.puzzle, runState?.extraLetters, dictionary]);

  // Guardar automáticamente cuando cambia el estado
  useEffect(() => {
    if (runState && runState.foundWords.length > 0) {
      saveExoticsRun(runState);
    }
  }, [runState?.foundWords, runState?.scorePoints, runState?.xpEarned]);

  const handleLetterClick = (letter: string) => {
    setClickedWord(prev => prev + letter.toLowerCase());
  };

  const handleBackspace = () => {
    setClickedWord(prev => prev.slice(0, -1));
  };

  const handleDeleteLetter = () => {
    setClickedWord(prev => prev.slice(0, -1));
  };

  // ============= HELPERS PARA FOUNDWORDS VÁLIDOS =============

  /**
   * Verifica si una palabra (normalizada) es válida con el set ACTUAL de letras
   */
  const isWordValidWithCurrentLetters = (normalizedWord: string): boolean => {
    if (!runState) return false;
    
    const normalizedCenter = normalizeChar(runState.puzzle.center, true);
    const normalizedOuter = runState.puzzle.outer.map(l => normalizeChar(l, true));
    const normalizedExtra = runState.extraLetters.map(l => normalizeChar(l, true));
    const allowedSet = new Set([normalizedCenter, ...normalizedOuter, ...normalizedExtra]);
    
    // Debe contener centro
    if (!normalizedWord.includes(normalizedCenter)) return false;
    
    // Solo puede usar letras permitidas
    for (let i = 0; i < normalizedWord.length; i++) {
      if (!allowedSet.has(normalizedWord[i])) return false;
    }
    
    return true;
  };

  /**
   * Calcular palabras válidas con el set ACTUAL de letras
   * (de todas las palabras históricamente encontradas)
   */
  const getFoundWordsValid = (): string[] => {
    if (!runState) return [];
    return runState.foundWordsAll.filter(w => isWordValidWithCurrentLetters(w));
  };

  /**
   * Obtener Set de palabras normalizadas encontradas (para prevenir duplicados)
   */
  const getFoundWordsNormalizedSet = (): Set<string> => {
    if (!runState) return new Set();
    return new Set(runState.foundWordsAll.map(w => normalizeWord(w)));
  };

  const validateWordExotic = (word: string): ValidationResult => {
    if (!runState) {
      return { ok: false, reason: t('exotic.no_active_run') };
    }
    
    const normalized = normalizeWord(word);
    
    // 1. Longitud mínima
    if (normalized.length < 3) {
      return { ok: false, reason: t('game.min_letters').replace('{0}', '3') };
    }
    
    // 2. Debe contener la letra central
    const normalizedCenter = normalizeChar(runState.puzzle.center, true);
    if (!normalized.includes(normalizedCenter)) {
      return {
        ok: false,
        reason: t('game.must_contain').replace('{0}', normalizedCenter.toUpperCase()),
      };
    }
    
    // 3. Solo puede usar letras permitidas (centro + outer + extra letters)
    const normalizedOuter = runState.puzzle.outer.map(l => normalizeChar(l, true));
    const normalizedExtra = runState.extraLetters.map(l => normalizeChar(l, true));
    const allowedSet = new Set([normalizedCenter, ...normalizedOuter, ...normalizedExtra]);
    
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i];
      if (!allowedSet.has(ch)) {
        if (import.meta.env.DEV) {
          console.error(
            `[ExoticsPlay] ❌ LETRA RECHAZADA:`,
            `\n  Carácter rechazado: "${ch}" (código: ${ch.charCodeAt(0)})`,
            `\n  Palabra completa: "${normalized}"`,
            `\n  Palabra original: "${word}"`,
            `\n  Letras permitidas (allowedSet):`, Array.from(allowedSet).sort(),
            `\n  Centro: "${runState.puzzle.center}" → "${normalizedCenter}"`,
            `\n  Outer: [${runState.puzzle.outer.join(', ')}] → [${normalizedOuter.join(', ')}]`,
            `\n  Extra: [${runState.extraLetters.join(', ')}] → [${normalizedExtra.join(', ')}]`
          );
        }
        return { ok: false, reason: t('exotic.only_available_letters') };
      }
    }
    
    // 4. Debe existir en las soluciones
    if (!puzzleSolutions.includes(normalized)) {
      return { ok: false, reason: t('exotic.invalid_word') };
    }
    
    // 5. No debe estar ya encontrada (verificar contra foundWordsAll normalizado)
    const foundSet = getFoundWordsNormalizedSet();
    if (foundSet.has(normalized)) {
      return { ok: false, reason: t('game.already_found_word') };
    }
    
    return { ok: true };
  };

  const isSuperHepta = (word: string): boolean => {
    if (!runState) return false;
    
    const normalized = normalizeWord(word);
    const normalizedCenter = normalizeChar(runState.puzzle.center, true);
    const normalizedOuter = runState.puzzle.outer.map(l => normalizeChar(l, true));
    const allLetters = [normalizedCenter, ...normalizedOuter];
    
    for (const letter of allLetters) {
      if (!normalized.includes(letter)) {
        return false;
      }
    }
    
    return true;
  };

  // Calcular puntos por palabra según longitud
  const calculateWordPoints = (word: string, isSuperHepta: boolean): number => {
    const len = word.length;
    let points = 0;
    
    if (len === 3) points = 20;
    else if (len === 4) points = 25;
    else if (len === 5) points = 30;
    else if (len === 6) points = 35;
    else if (len === 7) points = 45;
    else if (len >= 8) points = 55 + (len - 8) * 5;
    
    // Bonus SuperHepta
    if (isSuperHepta) {
      points += 60;
    }
    
    return points;
  };

  // Calcular bonus por hitos cada 10 palabras
  const calculateMilestoneBonus = (wordCount: number, previousStreak10Count: number): { bonus: number; newStreak10Count: number } => {
    const currentMilestone = Math.floor(wordCount / 10);
    
    // CAP: después de 100 palabras (milestone 10), no dar más bonuses
    if (currentMilestone > 10) {
      return { bonus: 0, newStreak10Count: previousStreak10Count };
    }
    
    // Si ya se cobró este hito, no dar bonus
    if (currentMilestone <= previousStreak10Count) {
      return { bonus: 0, newStreak10Count: previousStreak10Count };
    }
    
    // Calcular bonus según el hito
    const bonuses = [
      0,    // 0: no usado
      150,  // 1: 10 palabras
      225,  // 2: 20 palabras
      340,  // 3: 30 palabras
      510,  // 4: 40 palabras
      765,  // 5: 50 palabras
      1147, // 6: 60 palabras (765 * 1.5)
      1720, // 7: 70 palabras (1147 * 1.5)
      2580, // 8: 80 palabras (1720 * 1.5)
      3870, // 9: 90 palabras (2580 * 1.5)
      5805, // 10: 100 palabras (3870 * 1.5)
    ];
    
    const bonus = bonuses[currentMilestone] || 0;
    
    return { bonus, newStreak10Count: currentMilestone };
  };

  // Verificar si puede cambiar de heptagrama gratis
  const canChangePuzzleFree = (): boolean => {
    if (!runState || puzzleSolutions.length === 0) return false;
    
    const foundWordsValid = getFoundWordsValid();
    const foundCount = foundWordsValid.length;
    const progressPercent = foundCount / puzzleSolutions.length;
    
    // Condición 1: >= 50% de progreso
    if (progressPercent >= 0.5) return true;
    
    // Condición 2: >= 100 palabras válidas encontradas (sin importar el %)
    if (foundCount >= 100) return true;
    
    return false;
  };

  // Cambiar a un nuevo puzzle (gratis)
  const handleChangePuzzleFree = async () => {
    if (!runState) return;
    
    const foundWordsValid = getFoundWordsValid();
    const progressPercent = puzzleSolutions.length > 0
      ? ((foundWordsValid.length / puzzleSolutions.length) * 100).toFixed(1)
      : '0.0';
    
    const confirmMsg = `¿Cambiar a un nuevo heptagrama? (GRATIS)\n\nProgreso actual: ${foundWordsValid.length}/${puzzleSolutions.length} palabras (${progressPercent}%)\n\n✓ Se MANTENDRÁN tus ${runState.scorePoints} P y ${runState.xpEarned} XP\n✓ Se REINICIARÁ el contador de palabras\n✓ Bonus de hitos se podrán obtener de nuevo`;
    
    if (!confirm(confirmMsg)) return;
    
    setIsGeneratingNewPuzzle(true);
    setGenerationProgress({ attempts: 0, lastCount: 0 });
    
    try {
      const newPuzzle = await generateExoticPuzzle(
        dictionary,
        (attempts, lastCount) => {
          setGenerationProgress({ attempts, lastCount });
        }
      );
      
      if (!newPuzzle) {
        alert('No se pudo generar un nuevo puzzle. Intenta de nuevo.');
        setIsGeneratingNewPuzzle(false);
        return;
      }
      
      // NEW_PUZZLE: Actualizar run con nuevo puzzle, RESETEAR foundWordsAll
      const updatedRun: ExoticsRunState = {
        ...runState,
        puzzle: newPuzzle,
        foundWords: [], // Mantener por compatibilidad
        foundWordsAll: [], // Resetear histórico
        solutionsTotal: 0, // Se recalculará en el useEffect
        streak10Count: 0, // Reiniciar contador de hitos de 10
        milestones: {
          reached50Percent: false,
          reached100Found: false,
          claimed50PercentBonus: false,
        },
        // MANTENER: scorePoints, xpEarned, extraLetters
      };
      
      setRunState(updatedRun);
      saveExoticsRun(updatedRun);
      setIsGeneratingNewPuzzle(false);
      
      setMessage(t('exotic.new_heptagram_loaded'));
      scheduleTimeout(() => setMessage(''), 4000);
      
      if (import.meta.env.DEV) {
        console.log('[ExoticsPlay] NEW_PUZZLE: Puzzle cambiado gratis. foundWordsAll reseteado:', {
          scorePoints: updatedRun.scorePoints,
          xpEarned: updatedRun.xpEarned,
          newOuter: newPuzzle.outer,
        });
      }
    } catch (error) {
      console.error('[ExoticsPlay] Error al generar nuevo puzzle:', error);
      alert('Error al generar puzzle.');
      setIsGeneratingNewPuzzle(false);
    }
  };

  // ============= HABILIDADES =============

  // Obtener todas las letras en uso (no disponibles para comprar/swap)
  const getUsedLetters = (): Set<string> => {
    if (!runState) return new Set();
    const used = new Set<string>();
    used.add(runState.puzzle.center.toLowerCase());
    runState.puzzle.outer.forEach(l => used.add(l.toLowerCase()));
    runState.extraLetters.forEach(l => used.add(l.toLowerCase()));
    return used;
  };

  // Obtener letras disponibles (a-z, sin ñ, sin usadas)
  const getAvailableLetters = (): string[] => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(l => l !== 'ñ');
    const used = getUsedLetters();
    return alphabet.filter(l => !used.has(l));
  };

  // 1. Pista de longitud (40 P)
  const handleLengthHint = () => {
    if (!runState || runState.scorePoints < 40 || runState.statsUnlocked.lengthHint) return;
    
    // Calcular palabras restantes por longitud
    const remaining = puzzleSolutions.filter(w => !runState.foundWords.includes(w));
    const byLength: { [key: number]: number } = {};
    
    remaining.forEach(word => {
      const len = word.length;
      byLength[len] = (byLength[len] || 0) + 1;
    });
    
    // Cobrar y marcar como desbloqueado
    const updated: ExoticsRunState = {
      ...runState,
      scorePoints: runState.scorePoints - 40,
      statsUnlocked: { ...runState.statsUnlocked, lengthHint: true },
      uiState: { ...runState.uiState, lengthHintExpanded: true },
    };
    setRunState(updated);
    saveExoticsRun(updated);
    setShowAbilitiesPanel(false);
    
    setMessage('💡 Pista de longitud desbloqueada!');
    scheduleTimeout(() => setMessage(''), 3000);
    
    if (import.meta.env.DEV) {
      console.log('[ExoticsPlay] Pista longitud comprada:', byLength);
    }
  };

  // 2. Desbloquear "por letra inicial" (120 P)
  const handleUnlockByStartLetter = () => {
    if (!runState || runState.scorePoints < 120 || runState.statsUnlocked.byStartLetter) return;
    
    const updated: ExoticsRunState = {
      ...runState,
      scorePoints: runState.scorePoints - 120,
      statsUnlocked: { ...runState.statsUnlocked, byStartLetter: true },
      uiState: { ...runState.uiState, byStartLetterExpanded: true },
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowAbilitiesPanel(false);
    
    setMessage(t('exotic.start_letter_unlocked'));
    scheduleTimeout(() => setMessage(''), 3000);
  };

  // 3. Cambiar letra aleatoria (160 P)
  const handleSwapLetterRandom = () => {
    if (!runState || runState.scorePoints < 160) return;
    setAbilityFlow({ type: 'swap-random', selectedOuterIndex: null });
    setShowAbilitiesPanel(false);
  };

  // Confirmar cambio aleatorio tras selección
  const confirmSwapRandom = () => {
    if (!runState || abilityFlow.selectedOuterIndex === null) return;
    
    const available = getAvailableLetters();
    const oldLetter = runState.puzzle.outer[abilityFlow.selectedOuterIndex];
    
    // Elegir letra nueva aleatoria DIFERENTE
    const availableForSwap = available.filter(l => l !== oldLetter.toLowerCase());
    if (availableForSwap.length === 0) {
      alert(t('exotic.no_letters_to_swap'));
      setAbilityFlow({ type: null, selectedOuterIndex: null });
      return;
    }
    
    const newLetter = availableForSwap[Math.floor(Math.random() * availableForSwap.length)];
    
    // Crear nuevo outer con inmutabilidad completa
    const newOuter = [...runState.puzzle.outer];
    newOuter[abilityFlow.selectedOuterIndex] = newLetter;
    
    // Crear nuevo puzzle con nueva referencia
    const newPuzzle = { ...runState.puzzle, outer: newOuter };
    
    // MODIFY_PUZZLE: Mantener foundWordsAll, recalcular progreso
    const updated: ExoticsRunState = {
      ...runState,
      puzzle: newPuzzle,
      scorePoints: runState.scorePoints - 160,
      foundWords: runState.foundWordsAll, // Mantener compatibilidad
      // foundWordsAll se mantiene automáticamente
    };
    
    // Limpiar caché porque las letras cambiaron
    solutionsCacheRef.current.clear();
    
    setRunState(updated);
    saveExoticsRun(updated);
    setAbilityFlow({ type: null, selectedOuterIndex: null });
    
    if (import.meta.env.DEV) {
      console.log(`[ExoticsPlay] 🔄 MODIFY_PUZZLE: Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
      console.log('[ExoticsPlay] foundWordsAll mantenido:', runState.foundWordsAll.length);
      console.log('[ExoticsPlay] Nuevo outer:', newOuter);
    }
    
    setMessage(`🔄 Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
    scheduleTimeout(() => setMessage(''), 3000);
  };

  // 4. Cambiar letra concreta (320 P) - abre selector de letra a cambiar
  const handleSwapLetterConcrete = () => {
    if (!runState || runState.scorePoints < 320) return;
    setAbilityFlow({ type: 'swap-concrete', selectedOuterIndex: null });
    setShowAbilitiesPanel(false);
  };

  // Abrir selector de letras disponibles tras seleccionar letra a cambiar
  const openLetterSelectorForSwap = () => {
    if (abilityFlow.selectedOuterIndex === null) return;
    setLetterSelectorMode('swap');
    setShowLetterSelector(true);
  };

  // Confirmar cambio de letra concreta
  const confirmSwapLetter = (newLetter: string) => {
    if (!runState || abilityFlow.selectedOuterIndex === null) return;
    
    const oldLetter = runState.puzzle.outer[abilityFlow.selectedOuterIndex];
    
    // Crear nuevo outer con inmutabilidad completa
    const newOuter = [...runState.puzzle.outer];
    newOuter[abilityFlow.selectedOuterIndex] = newLetter.toLowerCase();
    
    // Crear nuevo puzzle con nueva referencia
    const newPuzzle = { ...runState.puzzle, outer: newOuter };
    
    // MODIFY_PUZZLE: Mantener foundWordsAll
    const updated: ExoticsRunState = {
      ...runState,
      puzzle: newPuzzle,
      scorePoints: runState.scorePoints - 320,
      foundWords: runState.foundWordsAll, // Mantener compatibilidad
      // foundWordsAll se mantiene automáticamente
    };
    
    // Limpiar caché porque las letras cambiaron
    solutionsCacheRef.current.clear();
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowLetterSelector(false);
    setAbilityFlow({ type: null, selectedOuterIndex: null });
    
    if (import.meta.env.DEV) {
      console.log(`[ExoticsPlay] 🔄 MODIFY_PUZZLE: Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
      console.log('[ExoticsPlay] foundWordsAll mantenido:', runState.foundWordsAll.length);
      console.log('[ExoticsPlay] Nuevo outer:', newOuter);
    }
    
    setMessage(`🔄 Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
    scheduleTimeout(() => setMessage(''), 3000);
  };

  // 5. Comprar letra aleatoria (450 P)
  const handleBuyLetterRandom = () => {
    if (!runState || runState.scorePoints < 450) return;
    
    const available = getAvailableLetters();
    if (available.length === 0) {
      alert(t('exotic.no_letters_to_buy'));
      return;
    }
    
    const newLetter = available[Math.floor(Math.random() * available.length)];
    
    // MODIFY_PUZZLE: Añadir letra extra, mantener foundWordsAll
    const updated: ExoticsRunState = {
      ...runState,
      extraLetters: [...runState.extraLetters, newLetter],
      scorePoints: runState.scorePoints - 450,
      foundWords: runState.foundWordsAll, // Mantener compatibilidad
      // foundWordsAll se mantiene automáticamente
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowAbilitiesPanel(false);
    
    if (import.meta.env.DEV) {
      console.log(`[ExoticsPlay] ✨ MODIFY_PUZZLE: Letra extra añadida: ${newLetter.toUpperCase()}`);
      console.log('[ExoticsPlay] foundWordsAll mantenido:', runState.foundWordsAll.length);
    }
    
    setMessage(`✨ Letra extra añadida: ${newLetter.toUpperCase()}`);
    scheduleTimeout(() => setMessage(''), 3000);
  };

  // 6. Comprar letra concreta (900 P) - abre selector
  const handleBuyLetterConcrete = () => {
    if (!runState || runState.scorePoints < 900) return;
    
    setLetterSelectorMode('buy');
    setShowLetterSelector(true);
    setShowAbilitiesPanel(false);
  };

  // Confirmar compra de letra concreta
  const confirmBuyLetter = (letter: string) => {
    if (!runState) return;
    
    // MODIFY_PUZZLE: Añadir letra extra, mantener foundWordsAll
    const updated: ExoticsRunState = {
      ...runState,
      extraLetters: [...runState.extraLetters, letter.toLowerCase()],
      scorePoints: runState.scorePoints - 900,
      foundWords: runState.foundWordsAll, // Mantener compatibilidad
      // foundWordsAll se mantiene automáticamente
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowLetterSelector(false);
    
    if (import.meta.env.DEV) {
      console.log(`[ExoticsPlay] ✨ MODIFY_PUZZLE: Letra extra añadida: ${letter.toUpperCase()}`);
      console.log('[ExoticsPlay] foundWordsAll mantenido:', runState.foundWordsAll.length);
    }
    
    setMessage(`✨ Letra extra añadida: ${letter.toUpperCase()}`);
    scheduleTimeout(() => setMessage(''), 3000);
  };

  // 7. Mezclar letras (10 P)
  const handleShuffleLetters = () => {
    if (!runState || runState.scorePoints < 10) return;
    
    // Cobrar y aplicar shuffle
    setShuffleSeed(prev => prev + 1);
    
    const updated: ExoticsRunState = {
      ...runState,
      scorePoints: runState.scorePoints - 10,
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowAbilitiesPanel(false);
    
    setMessage('🔄 Letras mezcladas!');
    scheduleTimeout(() => setMessage(''), 2000);
    
    if (import.meta.env.DEV) {
      console.log('[ExoticsPlay] Mezcla aplicada, nuevo seed:', shuffleSeed + 1);
    }
  };

  // 8. Doble puntos x10 palabras (240 P)
  const handleDoublePointsBoost = () => {
    if (!runState || runState.scorePoints < 240) return;
    
    const updated: ExoticsRunState = {
      ...runState,
      doublePointsRemaining: 10,
      scorePoints: runState.scorePoints - 240,
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowAbilitiesPanel(false);
    
    setMessage(t('exotic.double_points_active'));
    scheduleTimeout(() => setMessage(''), 4000);
  };

  // 9. Nuevo puzzle antes del 50% (350 P)
  const handleBuyNewPuzzle = async () => {
    if (!runState || runState.scorePoints < 350) return;
    
    const foundWordsValid = getFoundWordsValid();
    const progressPercent = puzzleSolutions.length > 0
      ? foundWordsValid.length / puzzleSolutions.length
      : 0;
    
    if (progressPercent >= 0.5) {
      alert(t('exotic.buy_new_before_50'));
      return;
    }
    
    const confirmMsg = `¿Generar nuevo heptagrama por 350 P?\n\nSe reiniciarán las palabras encontradas pero mantendrás tus puntos y XP.`;
    if (!confirm(confirmMsg)) return;
    
    // Cobrar primero
    const updatedWithCost = { ...runState, scorePoints: runState.scorePoints - 350 };
    setRunState(updatedWithCost);
    saveExoticsRun(updatedWithCost);
    
    setIsGeneratingNewPuzzle(true);
    setGenerationProgress({ attempts: 0, lastCount: 0 });
    
    try {
      const newPuzzle = await generateExoticPuzzle(
        dictionary,
        (attempts, lastCount) => {
          setGenerationProgress({ attempts, lastCount });
        }
      );
      
      if (!newPuzzle) {
        alert(t('exotic.refund_generate_failed'));
        const refunded = { ...updatedWithCost, scorePoints: updatedWithCost.scorePoints + 350 };
        setRunState(refunded);
        saveExoticsRun(refunded);
        setIsGeneratingNewPuzzle(false);
        return;
      }
      
      // NEW_PUZZLE: Resetear foundWordsAll
      const updated: ExoticsRunState = {
        ...updatedWithCost,
        puzzle: newPuzzle,
        foundWords: [], // Mantener compatibilidad
        foundWordsAll: [], // Resetear histórico
        solutionsTotal: 0,
        streak10Count: 0,
        milestones: {
          reached50Percent: false,
          reached100Found: false,
          claimed50PercentBonus: false,
        },
      };
      
      // Limpiar caché porque es un puzzle completamente nuevo
      solutionsCacheRef.current.clear();
      
      setRunState(updated);
      saveExoticsRun(updated);
      setIsGeneratingNewPuzzle(false);
      setShowAbilitiesPanel(false);
      
      if (import.meta.env.DEV) {
        console.log('[ExoticsPlay] NEW_PUZZLE: Nuevo puzzle comprado, foundWordsAll reseteado:', {
          newOuter: newPuzzle.outer,
          pointsRemaining: updated.scorePoints,
        });
      }
      
      setMessage(t('exotic.new_heptagram_bought'));
      scheduleTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('[ExoticsPlay] Error al generar puzzle:', error);
      alert(t('exotic.refund_error'));
      const refunded = { ...updatedWithCost, scorePoints: updatedWithCost.scorePoints + 350 };
      setRunState(refunded);
      saveExoticsRun(refunded);
      setIsGeneratingNewPuzzle(false);
    }
  };

  const handleSubmit = (word: string) => {
    if (!runState) return;
    
    const result = validateWordExotic(word);
    
    if (!result.ok) {
      setMessage(result.reason || t('settings.msg_unknown_error'));
      scheduleTimeout(() => setMessage(''), 3000);
      setClickedWord('');
      
      // Solo mostrar nuevo feedback si no hay uno activo
      if (!isFeedbackActive) {
        setIsFeedbackActive(true);
        // Mostrar feedback específico
        if (result.reason === t('game.already_found_word') || result.reason?.includes(t('game.already_found_word'))) {
          setFeedbackType('already-found');
        } else if (result.reason?.includes(t('game.must_contain').split('{0}')[0])) {
          setFeedbackType('missing-central');
        } else {
          setFeedbackType('incorrect');
        }
      }
      
      if (import.meta.env.DEV) {
        console.log(
          `[ExoticsPlay] Palabra rechazada: "${word}"`,
          `\nRazón: ${result.reason}`
        );
      }
      return;
    }
    
    const normalized = normalizeWord(word);
    
    // Mostrar feedback de correcto
    setShowSuccessAnim(true);
    const newFoundWordsAll = [...runState.foundWordsAll, normalized].sort();
    
    // Calcular foundWordsValid DESPUÉS de añadir la nueva palabra
    // (para usar en progreso y hitos)
    const newFoundWordsValid = newFoundWordsAll.filter(w => isWordValidWithCurrentLetters(w));
    const validWordCount = newFoundWordsValid.length;
    
    // Verificar si es SuperHepta
    const isSH = isSuperHepta(normalized);
    
    // Calcular puntos de la palabra
    let wordPoints = calculateWordPoints(normalized, isSH);
    
    // Aplicar multiplicador de doble puntos si está activo
    const hasDoublePoints = runState.doublePointsRemaining > 0;
    if (hasDoublePoints) {
      wordPoints *= 2;
    }
    
    // Verificar hito cada 10 palabras VÁLIDAS (NO se multiplica)
    const { bonus: milestoneBonus, newStreak10Count } = calculateMilestoneBonus(
      validWordCount,
      runState.streak10Count
    );
    
    // Calcular puntos totales
    const totalPointsThisWord = wordPoints + milestoneBonus;
    let newScore = runState.scorePoints + totalPointsThisWord;
    
    // Decrementar doublePointsRemaining
    const newDoublePoints = hasDoublePoints ? runState.doublePointsRemaining - 1 : 0;
    
    // Calcular XP (40% de los puntos, redondeado)
    const xpFromPoints = Math.round(totalPointsThisWord * 0.4);
    let newXP = runState.xpEarned + xpFromPoints;
    
    // Verificar si alcanzó el 50% y dar bonus único de +250 P (usar foundWordsValid)
    const progressPercent = puzzleSolutions.length > 0 
      ? validWordCount / puzzleSolutions.length 
      : 0;
    const reached50 = progressPercent >= 0.5;
    let bonus50Percent = 0;
    let newMilestones = { ...runState.milestones };
    
    if (reached50 && !runState.milestones.reached50Percent && !runState.milestones.claimed50PercentBonus) {
      bonus50Percent = 250;
      newScore += bonus50Percent;
      newXP += Math.round(bonus50Percent * 0.4); // +100 XP del bonus
      newMilestones.reached50Percent = true;
      newMilestones.claimed50PercentBonus = true;
      
      if (import.meta.env.DEV) {
        console.log(`[ExoticsPlay] 🎯 ¡50% ALCANZADO! Bonus: +${bonus50Percent} P (+100 XP)`);
      }
    }
    
    // Verificar si alcanzó 100 palabras VÁLIDAS encontradas
    if (validWordCount >= 100 && !runState.milestones.reached100Found) {
      newMilestones.reached100Found = true;
    }
    
    // Log detallado en desarrollo
    if (import.meta.env.DEV) {
      console.log(
        `[ExoticsPlay] 📊 Palabra aceptada: "${normalized}"`,
        `\n  Longitud: ${normalized.length}`,
        `\n  SuperHepta: ${isSH}`,
        `\n  Puntos base: ${wordPoints}${isSH ? ' (incluye +60 SuperHepta)' : ''}`,
        milestoneBonus > 0 ? `\n  🎉 HITO! ${validWordCount} palabras → +${milestoneBonus} P` : '',
        bonus50Percent > 0 ? `\n  🎯 BONUS 50%! → +${bonus50Percent} P` : '',
        `\n  Total P: +${totalPointsThisWord + bonus50Percent}`,
        `\n  XP ganada: +${Math.round((totalPointsThisWord + bonus50Percent) * 0.4)}`,
        `\n  Nuevos totales: ${newScore} P, ${newXP} XP`,
        `\n  Palabras válidas: ${validWordCount}/${runState.solutionsTotal}`,
        `\n  Palabras totales (históricas): ${newFoundWordsAll.length}`,
        `\n  Progreso: ${Math.round(progressPercent * 100)}%`
      );
    }
    
    // Actualizar estado
    const updatedRun: ExoticsRunState = {
      ...runState,
      foundWords: newFoundWordsAll, // Mantener compatibilidad - ahora es igual a foundWordsAll
      foundWordsAll: newFoundWordsAll,
      scorePoints: newScore,
      xpEarned: newXP,
      streak10Count: newStreak10Count,
      milestones: newMilestones,
      doublePointsRemaining: newDoublePoints,
    };
    
    setRunState(updatedRun);
    saveExoticsRun(updatedRun);
    setClickedWord('');
    
    // Reproducir sonido
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
    setFeedbackType('correct');
    scheduleTimeout(() => setShowSuccessAnim(false), 600);
    
    // Mensaje de feedback
    let feedbackMessage = '';
    const doubleIndicator = hasDoublePoints ? ' ⚡x2' : '';
    
    if (bonus50Percent > 0) {
      feedbackMessage = `🎯 ¡50% COMPLETADO! +${bonus50Percent} P (GRATIS disponible)`;
    } else if (milestoneBonus > 0) {
      feedbackMessage = `🎉 ¡${validWordCount} PALABRAS! +${milestoneBonus} P`;
    } else if (isSH) {
      feedbackMessage = `¡SuperHepta! 🌟 +${wordPoints} P${doubleIndicator}`;
    } else {
      feedbackMessage = `¡Bien! +${wordPoints} P${doubleIndicator}`;
    }
    
    // Agregar contador de doble puntos restantes
    if (newDoublePoints > 0) {
      feedbackMessage += ` (⚡${newDoublePoints} restantes)`;
    }
    
    setMessage(feedbackMessage);
    scheduleTimeout(() => setMessage(''), bonus50Percent > 0 ? 6000 : (milestoneBonus > 0 ? 5000 : 3000));
  };

  const handleEndRun = () => {
    if (!runState) return;
    
    const foundWordsValid = getFoundWordsValid();
    const progressPercent = puzzleSolutions.length > 0 
      ? (foundWordsValid.length / puzzleSolutions.length) * 100 
      : 0;
    
    const confirmMsg = `¿Terminar esta run?\n\nPuntos: ${runState.scorePoints} P\nXP acumulada: ${runState.xpEarned}\nPalabras válidas: ${foundWordsValid.length}/${puzzleSolutions.length} (${progressPercent.toFixed(1)}%)\n\nEl XP se sumará a tu nivel global.`;
    
    if (confirm(confirmMsg)) {
      // Sumar XP al playerState global
      const playerState = loadPlayerState();
      const oldXP = playerState.xpTotal;
      const oldLevel = playerState.level;
      
      playerState.xpTotal += runState.xpEarned;
      playerState.level = calculateLevel(playerState.xpTotal);
      
      // Guardar cosmetics unlock si ya existe en playerState
      // (por ahora no hay sistema de cosméticos en exóticos, así que se mantiene igual)
      
      savePlayerState(playerState);
      
      if (import.meta.env.DEV) {
        console.log('[ExoticsPlay] Run terminada por el usuario');
        console.log(`[ExoticsPlay] XP ganada: +${runState.xpEarned} (${oldXP} → ${playerState.xpTotal})`);
        console.log(`[ExoticsPlay] Nivel: ${oldLevel} → ${playerState.level}`);
      }
      
      // Limpiar run state de localStorage
      clearExoticsRun();
      
      // Volver a ExoticsHome
      onBack();
    }
  };

  if (!runState) {
    return (
      <PageContainer>
        <TopBar 
          onThemeClick={() => {}} 
          onSettingsClick={() => {}}
          title={t('home.exotic_title')}
          showThemeButton={false}
          showSettingsButton={false}
          leftButton={
            <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
              ←
            </button>
          }
        />
        <header className="header">
            <h1>{t('common.loading')}</h1>
        </header>
      </PageContainer>
    );
  }

  // Logging de render para debugging (solo dev)
  if (import.meta.env.DEV && runState) {
    console.log('[ExoticsPlay] 🔄 RENDER:', {
      center: runState.puzzle.center,
      outer: runState.puzzle.outer.join(''),
      outerRef: runState.puzzle.outer,
      shuffledOuter: shuffledOuter.join(''),
      shuffleSeed,
      extraLetters: runState.extraLetters.join(''),
      foundWords: runState.foundWords.length,
    });
  }

  return (
    <PageContainer wide>
      <TopBar 
        onThemeClick={() => {}} 
        onSettingsClick={() => {}}
        title={t('home.exotic_title')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            ←
          </button>
        }
      />
      
      <div className="game-layout exotics-layout">
        {/* Panel central: Tablero y controles */}
        <div className="game-main exotics-main">
          {(() => {
            const foundWordsValid = getFoundWordsValid();
            return (
              <div className="puzzle-header">
                <h2 className="puzzle-title">
                  {t('game.words_found')}: {foundWordsValid.length}
                  {runState.solutionsTotal > 0 && ` / ${runState.solutionsTotal}`}
                  {runState.foundWordsAll.length > foundWordsValid.length && 
                    <span className="invalid-count"> ({runState.foundWordsAll.length - foundWordsValid.length} {t('game.invalid_words')})</span>
                  }
                </h2>
              </div>
            );
          })()}

          <div className="board-header">
            <div className="board-points">
              <span className="points-icon">⭐</span>
              <span className="points-value">{runState.scorePoints}</span>
            </div>
            <button 
              className="btn-abilities-header"
              onClick={() => setShowAbilitiesPanel(true)}
              title={t('exotic.abilities_title')}
            >
              ⚡
            </button>
          </div>

          <div className="board-container">
            <HeptagramBoardSvg
              key={`${runState.puzzle.center}-${outerCombined.join('')}`}
              ref={heptagramRef}
              center={runState.puzzle.center}
              outer={shuffledOuter}
              onLetterClick={handleLetterClick}
              onShuffleOuter={() => setShuffleSeed(prev => prev + 1)}
              successAnimation={showSuccessAnim}
              extraLetterIndices={extraLetterIndices}
            />
          </div>

          <UnifiedFeedback 
            type={feedbackType}
            onAnimationEnd={() => {
              setFeedbackType(null);
              setIsFeedbackActive(false);
            }}
          />

          <WordInput
            clickedWord={clickedWord}
            message={message}
            onSubmit={handleSubmit}
            onBackspace={handleBackspace}
            onDeleteLetter={handleDeleteLetter}
            successAnimation={showSuccessAnim}
          />
        </div>

        {/* Botón único de finalizar partida */}
        <div className="exotic-run-panel">
          <button className="btn-end-run" onClick={handleEndRun}>
            {t('exotic.end_run')}
          </button>
        </div>

        {/* Panel derecho: Lista de palabras */}
        <div className="game-sidebar">
          {(() => {
            const foundWordsValid = getFoundWordsValid();
            const invalidWords = runState.foundWordsAll.filter(w => !foundWordsValid.includes(w));
            
            return (
              <FoundWordsList 
                words={runState.foundWordsAll}
                total={puzzleSolutions.length}
                superHeptaWords={[]}
                invalidWords={invalidWords}
              />
            );
          })()}
          
          {/* Panel: Pista de Longitud */}
          {runState.statsUnlocked.lengthHint && (
            <div className="length-hints-panel">
              <div className="hint-panel-header">
                <h4>💡 Pistas de Longitud</h4>
                <button 
                  className="btn-toggle-hint" 
                  onClick={() => {
                    const updated = {
                      ...runState,
                      uiState: { ...runState.uiState, lengthHintExpanded: !runState.uiState.lengthHintExpanded }
                    };
                    setRunState(updated);
                    saveExoticsRun(updated);
                  }}
                >
                  {runState.uiState.lengthHintExpanded ? '▼' : '▶'}
                </button>
              </div>
              {runState.uiState.lengthHintExpanded && (() => {
                const foundWordsValid = getFoundWordsValid();
                const remaining = puzzleSolutions.filter(w => !foundWordsValid.includes(w));
                const byLength: { [key: number]: number } = {};
                remaining.forEach(word => {
                  const len = word.length;
                  byLength[len] = (byLength[len] || 0) + 1;
                });
                return (
                  <div className="length-hints-list">
                    {Object.entries(byLength)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([len, count]) => (
                        <div key={len} className="length-hint-item">
                          <span>{len} letras:</span>
                          <span className="hint-count">{count} pendientes</span>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Panel: Por Letra Inicial */}
          {runState.statsUnlocked.byStartLetter && (
            <div className="start-letter-panel">
              <div className="hint-panel-header">
                <h4>🔤 Por Letra Inicial</h4>
                <button 
                  className="btn-toggle-hint" 
                  onClick={() => {
                    const updated = {
                      ...runState,
                      uiState: { ...runState.uiState, byStartLetterExpanded: !runState.uiState.byStartLetterExpanded }
                    };
                    setRunState(updated);
                    saveExoticsRun(updated);
                  }}
                >
                  {runState.uiState.byStartLetterExpanded ? '▼' : '▶'}
                </button>
              </div>
              {runState.uiState.byStartLetterExpanded && (() => {
                // Obtener las letras del puzzle base (center + outer, sin extras)
                const baseLetters = [runState.puzzle.center, ...runState.puzzle.outer]
                  .map(l => normalizeChar(l, true))
                  .sort();
                
                const foundWordsValid = getFoundWordsValid();
                const foundSet = new Set(foundWordsValid);
                const statsByLetter: { [letter: string]: { total: number; pending: number } } = {};
                
                // Calcular totales y pendientes por letra (usando foundWordsValid)
                puzzleSolutions.forEach(word => {
                  const firstLetter = word[0];
                  if (baseLetters.includes(firstLetter)) {
                    if (!statsByLetter[firstLetter]) {
                      statsByLetter[firstLetter] = { total: 0, pending: 0 };
                    }
                    statsByLetter[firstLetter].total++;
                    if (!foundSet.has(word)) {
                      statsByLetter[firstLetter].pending++;
                    }
                  }
                });
                
                return (
                  <div className="start-letter-list">
                    {baseLetters
                      .filter((letter, index, self) => self.indexOf(letter) === index) // unique
                      .sort()
                      .map(letter => {
                        const stats = statsByLetter[letter] || { total: 0, pending: 0 };
                        const found = stats.total - stats.pending;
                        return (
                          <div key={letter} className="start-letter-item">
                            <span className="letter-label">{letter.toUpperCase()}:</span>
                            <span className="letter-stats">
                              {found}/{stats.total} <span className="pending-count">(pendientes: {stats.pending})</span>
                            </span>
                          </div>
                        );
                      })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Panel de Habilidades */}
      {showAbilitiesPanel && (
        <div className="modal-overlay" onClick={() => setShowAbilitiesPanel(false)}>
          <div className="abilities-panel" onClick={(e) => e.stopPropagation()}>
            <h2>{t('exotic.abilities_title')}</h2>
            <p className="abilities-balance">{t('exotic.you_have_points').replace('{0}', String(runState.scorePoints))}</p>
            
            <div className="abilities-list">
              {/* Pista longitud */}
              <button 
                className="ability-btn"
                onClick={handleLengthHint}
                disabled={runState.scorePoints < 40 || runState.statsUnlocked.lengthHint}
              >
                <span className="ability-icon">💡</span>
                <span className="ability-name">
                  {runState.statsUnlocked.lengthHint ? '✓ Pista de longitud' : 'Pista de longitud'}
                </span>
                <span className="ability-cost">40 P</span>
              </button>

              {/* Desbloquear por letra inicial */}
              <button 
                className="ability-btn"
                onClick={handleUnlockByStartLetter}
                disabled={runState.scorePoints < 120 || runState.statsUnlocked.byStartLetter}
              >
                <span className="ability-icon">🔓</span>
                <span className="ability-name">
                  {runState.statsUnlocked.byStartLetter ? '✓ Por letra inicial' : 'Desbloquear por inicial'}
                </span>
                <span className="ability-cost">120 P</span>
              </button>

              {/* Cambiar letra aleatoria */}
              <button 
                className="ability-btn"
                onClick={handleSwapLetterRandom}
                disabled={runState.scorePoints < 160}
              >
                <span className="ability-icon">🔄</span>
                <span className="ability-name">Cambiar letra (aleatoria)</span>
                <span className="ability-cost">160 P</span>
              </button>

              {/* Cambiar letra concreta */}
              <button 
                className="ability-btn"
                onClick={handleSwapLetterConcrete}
                disabled={runState.scorePoints < 320}
              >
                <span className="ability-icon">🎯</span>
                <span className="ability-name">Cambiar letra (elegir)</span>
                <span className="ability-cost">320 P</span>
              </button>

              {/* Comprar letra aleatoria */}
              <button 
                className="ability-btn"
                onClick={handleBuyLetterRandom}
                disabled={runState.scorePoints < 450}
              >
                <span className="ability-icon">✨</span>
                <span className="ability-name">Letra extra (aleatoria)</span>
                <span className="ability-cost">450 P</span>
              </button>

              {/* Comprar letra concreta */}
              <button 
                className="ability-btn"
                onClick={handleBuyLetterConcrete}
                disabled={runState.scorePoints < 900}
              >
                <span className="ability-icon">🌟</span>
                <span className="ability-name">Letra extra (elegir)</span>
                <span className="ability-cost">900 P</span>
              </button>

              {/* Mezclar letras */}
              <button 
                className="ability-btn"
                onClick={handleShuffleLetters}
                disabled={runState.scorePoints < 10}
              >
                <span className="ability-icon">🔄</span>
                <span className="ability-name">Mezclar letras (aleatorio)</span>
                <span className="ability-cost">10 P</span>
              </button>

              {/* Doble puntos */}
              <button 
                className="ability-btn"
                onClick={handleDoublePointsBoost}
                disabled={runState.scorePoints < 240 || runState.doublePointsRemaining > 0}
              >
                <span className="ability-icon">⚡</span>
                <span className="ability-name">
                  {runState.doublePointsRemaining > 0 ? `⚡ Activo (${runState.doublePointsRemaining})` : 'Doble P x10 palabras'}
                </span>
                <span className="ability-cost">240 P</span>
              </button>

              {/* Nuevo puzzle */}
              {canChangePuzzleFree() ? (
                <button
                  className="ability-btn"
                  onClick={handleChangePuzzleFree}
                >
                  <span className="ability-icon">🆓</span>
                  <span className="ability-name">Nuevo heptagrama (gratis)</span>
                  <span className="ability-cost">0 P</span>
                </button>
              ) : (
                <button 
                  className="ability-btn"
                  onClick={handleBuyNewPuzzle}
                  disabled={runState.scorePoints < 350}
                >
                  <span className="ability-icon">🔮</span>
                  <span className="ability-name">Nuevo heptagrama</span>
                  <span className="ability-cost">350 P</span>
                </button>
              )}
            </div>

            <button className="btn-close-panel" onClick={() => setShowAbilitiesPanel(false)}>
              {t('settings.cancel_btn')}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Seleccionar letra a cambiar */}
      {abilityFlow.type && (
        <div className="modal-overlay" onClick={() => setAbilityFlow({ type: null, selectedOuterIndex: null })}>
          <div className="letter-change-panel" onClick={(e) => e.stopPropagation()}>
            <h2>🔄 Cambiar Letra</h2>
            <p className="selector-instruction">
              {abilityFlow.selectedOuterIndex === null 
                ? t('exotic.select_outer_to_change')
                : t('exotic.selected_letter').replace('{0}', runState.puzzle.outer[abilityFlow.selectedOuterIndex].toUpperCase())}
            </p>
            
            {/* Mini tablero para selección */}
            <div className="mini-board-container">
              <div className="mini-board">
                <div 
                  className="mini-center-letter"
                  onClick={() => setMessage(t('exotic.center_cannot_change'))}
                  style={{ cursor: 'not-allowed', opacity: 0.5 }}
                >
                  {runState.puzzle.center.toUpperCase()}
                </div>
                <div className="mini-outer-letters">
                  {runState.puzzle.outer.map((letter, idx) => (
                    <button
                      key={idx}
                      className={`mini-outer-letter ${abilityFlow.selectedOuterIndex === idx ? 'selected' : ''}`}
                      onClick={() => setAbilityFlow({ ...abilityFlow, selectedOuterIndex: idx })}
                    >
                      {letter.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="letter-change-actions">
              {abilityFlow.selectedOuterIndex === null ? (
                <button className="btn-close-panel" onClick={() => setAbilityFlow({ type: null, selectedOuterIndex: null })}>
                  {t('settings.cancel_btn')}
                </button>
              ) : abilityFlow.type === 'swap-random' ? (
                <>
                  <button className="btn-confirm-change" onClick={confirmSwapRandom}>
                    {t('exotic.change_random_for_cost')}
                  </button>
                  <button className="btn-close-panel" onClick={() => setAbilityFlow({ type: null, selectedOuterIndex: null })}>
                    {t('settings.cancel_btn')}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-confirm-change" onClick={openLetterSelectorForSwap}>
                    {t('exotic.choose_new_letter_for_cost')}
                  </button>
                  <button className="btn-close-panel" onClick={() => setAbilityFlow({ type: null, selectedOuterIndex: null })}>
                    {t('settings.cancel_btn')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Selector de Letras */}
      {showLetterSelector && letterSelectorMode && (
        <div className="modal-overlay" onClick={() => setShowLetterSelector(false)}>
          <div className="letter-selector-panel" onClick={(e) => e.stopPropagation()}>
            <h2>🔤 Selecciona una letra</h2>
            <p className="selector-cost">
              {t('exotic.cost')}: {letterSelectorMode === 'swap' ? t('exotic.cost_320') : t('exotic.cost_900')}
            </p>
            
            <div className="letter-grid">
              {getAvailableLetters().map(letter => (
                <button
                  key={letter}
                  className="letter-btn"
                  onClick={() => {
                    if (letterSelectorMode === 'swap') {
                      confirmSwapLetter(letter);
                    } else {
                      confirmBuyLetter(letter);
                    }
                  }}
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>

            <button className="btn-close-panel" onClick={() => setShowLetterSelector(false)}>
              {t('settings.cancel_btn')}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
