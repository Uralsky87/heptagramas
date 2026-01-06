import { useState, useEffect, useRef } from 'react';
import HeptagramBoardSvg, { type HeptagramBoardHandle } from './HeptagramBoardSvg';
import WordInput from './WordInput';
import FoundWordsList from './FoundWordsList';
import type { ValidationResult, ExoticsRunState } from '../types';
import { normalizeWord } from '../lib/normalizeWord';
import { normalizeChar } from '../lib/normalizeChar';
import { playSuccessSound, playSuperHeptaSound } from '../lib/soundEffects';
import { loadPlayerState, savePlayerState } from '../lib/storage';
import { loadExoticsRun, saveExoticsRun, clearExoticsRun } from '../lib/exoticsStorage';
import { solvePuzzle } from '../lib/solvePuzzle';
import { generateExoticPuzzle } from '../lib/generateExoticPuzzle';
import { calculateLevel } from '../lib/xpSystem';
import type { DictionaryData } from '../lib/dictionary';
import '../exotics-styles.css';

interface ExoticsPlayProps {
  onBack: () => void;
  dictionary: DictionaryData;
}

export default function ExoticsPlay({ onBack, dictionary }: ExoticsPlayProps) {
  const [runState, setRunState] = useState<ExoticsRunState | null>(null);
  const [message, setMessage] = useState<string>('');
  const [clickedWord, setClickedWord] = useState('');
  const [puzzleSolutions, setPuzzleSolutions] = useState<string[]>([]);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [shuffledOuter, setShuffledOuter] = useState<string[]>([]);
  const [isGeneratingNewPuzzle, setIsGeneratingNewPuzzle] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ attempts: 0, lastCount: 0 });
  const [showAbilitiesPanel, setShowAbilitiesPanel] = useState(false);
  const [showLetterSelector, setShowLetterSelector] = useState(false);
  const [letterSelectorMode, setLetterSelectorMode] = useState<'swap' | 'buy' | null>(null);
  const [lengthHints, setLengthHints] = useState<{ [key: number]: number } | null>(null);
  const [isCalculatingSolutions, setIsCalculatingSolutions] = useState(false);
  const heptagramRef = useRef<HeptagramBoardHandle>(null);
  const solutionsCacheRef = useRef<Map<string, string[]>>(new Map());

  // Cargar run state al montar
  useEffect(() => {
    const run = loadExoticsRun();
    if (!run) {
      alert('No hay run activa. Volviendo al menú de Exóticos.');
      onBack();
      return;
    }
    
    setRunState(run);
    setShuffledOuter(run.puzzle.outer);
    
    if (import.meta.env.DEV) {
      console.log('[ExoticsPlay] Run cargada:', run.runId);
    }
  }, [onBack]);

  // Sincronizar shuffledOuter cuando cambia puzzle.outer
  useEffect(() => {
    if (runState) {
      setShuffledOuter(runState.puzzle.outer);
    }
  }, [runState?.puzzle.outer]);

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
    
    const timer = setTimeout(() => {
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

  const handleClearClicked = () => {
    setClickedWord('');
  };

  const handleBackspace = () => {
    setClickedWord(prev => prev.slice(0, -1));
  };

  const handleShuffle = () => {
    if (!runState) return;
    
    const current = shuffledOuter;
    let shuffled = [...current];
    
    // Algoritmo Fisher-Yates para shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setShuffledOuter(shuffled);
  };

  const validateWordExotic = (word: string): ValidationResult => {
    if (!runState) {
      return { ok: false, reason: 'No hay run activa.' };
    }
    
    const normalized = normalizeWord(word);
    
    // 1. Longitud mínima
    if (normalized.length < 3) {
      return { ok: false, reason: 'Mínimo 3 letras.' };
    }
    
    // 2. Debe contener la letra central
    const normalizedCenter = normalizeChar(runState.puzzle.center, false);
    if (!normalized.includes(normalizedCenter)) {
      return {
        ok: false,
        reason: `Debe contener la letra central: "${normalizedCenter.toUpperCase()}".`,
      };
    }
    
    // 3. Solo puede usar letras permitidas (centro + outer + extra letters)
    const normalizedOuter = runState.puzzle.outer.map(l => normalizeChar(l, false));
    const normalizedExtra = runState.extraLetters.map(l => normalizeChar(l, false));
    const allowedSet = new Set([normalizedCenter, ...normalizedOuter, ...normalizedExtra]);
    
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i];
      if (!allowedSet.has(ch)) {
        if (import.meta.env.DEV) {
          console.warn(
            `[ExoticsPlay] Letra NO permitida:`,
            `\nCarácter: "${ch}"`,
            `\nPalabra: "${normalized}"`,
            `\nLetras permitidas:`, Array.from(allowedSet)
          );
        }
        return { ok: false, reason: 'Solo puedes usar las letras disponibles.' };
      }
    }
    
    // 4. Debe existir en las soluciones
    if (!puzzleSolutions.includes(normalized)) {
      return { ok: false, reason: 'Palabra no válida.' };
    }
    
    // 5. No debe estar ya encontrada
    if (runState.foundWords.includes(normalized)) {
      return { ok: false, reason: 'Ya encontraste esta palabra.' };
    }
    
    return { ok: true };
  };

  const isSuperHepta = (word: string): boolean => {
    if (!runState) return false;
    
    const normalized = normalizeWord(word);
    const normalizedCenter = normalizeChar(runState.puzzle.center, false);
    const normalizedOuter = runState.puzzle.outer.map(l => normalizeChar(l, false));
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
    
    const foundCount = runState.foundWords.length;
    const progressPercent = foundCount / puzzleSolutions.length;
    
    // Condición 1: >= 50% de progreso
    if (progressPercent >= 0.5) return true;
    
    // Condición 2: >= 100 palabras encontradas (sin importar el %)
    if (foundCount >= 100) return true;
    
    return false;
  };

  // Cambiar a un nuevo puzzle (gratis)
  const handleChangePuzzleFree = async () => {
    if (!runState) return;
    
    const progressPercent = puzzleSolutions.length > 0
      ? ((runState.foundWords.length / puzzleSolutions.length) * 100).toFixed(1)
      : '0.0';
    
    const confirmMsg = `¿Cambiar a un nuevo heptagrama? (GRATIS)\n\nProgreso actual: ${runState.foundWords.length}/${puzzleSolutions.length} palabras (${progressPercent}%)\n\n✓ Se MANTENDRÁN tus ${runState.scorePoints} P y ${runState.xpEarned} XP\n✓ Se REINICIARÁ el contador de palabras\n✓ Bonus de hitos se podrán obtener de nuevo`;
    
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
      
      // Actualizar run con nuevo puzzle, mantener P y XP
      const updatedRun: ExoticsRunState = {
        ...runState,
        puzzle: newPuzzle,
        foundWords: [], // Reiniciar palabras encontradas
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
      
      setMessage('✨ ¡Nuevo heptagrama cargado! Tus P y XP se mantienen.');
      setTimeout(() => setMessage(''), 4000);
      
      if (import.meta.env.DEV) {
        console.log('[ExoticsPlay] Puzzle cambiado gratis. P y XP mantenidos:', {
          scorePoints: updatedRun.scorePoints,
          xpEarned: updatedRun.xpEarned,
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
    if (!runState || runState.scorePoints < 40) return;
    
    // Calcular palabras restantes por longitud
    const remaining = puzzleSolutions.filter(w => !runState.foundWords.includes(w));
    const byLength: { [key: number]: number } = {};
    
    remaining.forEach(word => {
      const len = word.length;
      byLength[len] = (byLength[len] || 0) + 1;
    });
    
    setLengthHints(byLength);
    
    // Cobrar
    const updated = { ...runState, scorePoints: runState.scorePoints - 40 };
    setRunState(updated);
    saveExoticsRun(updated);
    
    setMessage('💡 Pista de longitud activada!');
    setTimeout(() => setMessage(''), 3000);
    
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
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    
    setMessage('🔓 Estadísticas por letra inicial desbloqueadas!');
    setTimeout(() => setMessage(''), 3000);
  };

  // 3. Cambiar letra aleatoria (160 P)
  const handleSwapLetterRandom = () => {
    if (!runState || runState.scorePoints < 160) return;
    
    if (!confirm('¿Cambiar una letra aleatoria del tablero por 160 P?\n\nEsto regenerará el puzzle y puede cambiar las soluciones disponibles.')) {
      return;
    }
    
    const available = getAvailableLetters();
    if (available.length === 0) {
      alert('No hay letras disponibles para intercambiar.');
      return;
    }
    
    // Elegir letra aleatoria del outer
    const randomIdx = Math.floor(Math.random() * shuffledOuter.length);
    const oldLetter = shuffledOuter[randomIdx];
    
    // Elegir letra nueva aleatoria
    const newLetter = available[Math.floor(Math.random() * available.length)];
    
    // Actualizar
    const newOuter = [...shuffledOuter];
    newOuter[randomIdx] = newLetter;
    
    const updated: ExoticsRunState = {
      ...runState,
      puzzle: { ...runState.puzzle, outer: newOuter },
      scorePoints: runState.scorePoints - 160,
    };
    
    // Limpiar caché porque las letras cambiaron
    solutionsCacheRef.current.clear();
    
    setRunState(updated);
    saveExoticsRun(updated);
    
    setMessage(`🔄 Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // 4. Cambiar letra concreta (320 P) - abre selector
  const handleSwapLetterConcrete = () => {
    if (!runState || runState.scorePoints < 320) return;
    
    if (!confirm('¿Elegir qué letra cambiar por 320 P?\n\nPodrás seleccionar la letra que reemplazará una letra aleatoria del tablero.')) {
      return;
    }
    
    setLetterSelectorMode('swap');
    setShowLetterSelector(true);
    setShowAbilitiesPanel(false);
  };

  // Confirmar cambio de letra concreta
  const confirmSwapLetter = (newLetter: string) => {
    if (!runState) return;
    
    // Elegir letra aleatoria del outer para reemplazar
    const randomIdx = Math.floor(Math.random() * shuffledOuter.length);
    const oldLetter = shuffledOuter[randomIdx];
    
    const newOuter = [...shuffledOuter];
    newOuter[randomIdx] = newLetter.toLowerCase();
    
    const updated: ExoticsRunState = {
      ...runState,
      puzzle: { ...runState.puzzle, outer: newOuter },
      scorePoints: runState.scorePoints - 320,
    };
    
    // Limpiar caché porque las letras cambiaron
    solutionsCacheRef.current.clear();
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowLetterSelector(false);
    
    setMessage(`🔄 Letra cambiada: ${oldLetter.toUpperCase()} → ${newLetter.toUpperCase()}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // 5. Comprar letra aleatoria (450 P)
  const handleBuyLetterRandom = () => {
    if (!runState || runState.scorePoints < 450) return;
    
    const available = getAvailableLetters();
    if (available.length === 0) {
      alert('No hay letras disponibles para comprar.');
      return;
    }
    
    const newLetter = available[Math.floor(Math.random() * available.length)];
    
    const updated: ExoticsRunState = {
      ...runState,
      extraLetters: [...runState.extraLetters, newLetter],
      scorePoints: runState.scorePoints - 450,
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    
    setMessage(`✨ Letra extra añadida: ${newLetter.toUpperCase()}`);
    setTimeout(() => setMessage(''), 3000);
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
    
    const updated: ExoticsRunState = {
      ...runState,
      extraLetters: [...runState.extraLetters, letter.toLowerCase()],
      scorePoints: runState.scorePoints - 900,
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    setShowLetterSelector(false);
    
    setMessage(`✨ Letra extra añadida: ${letter.toUpperCase()}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // 7. Doble puntos x10 palabras (240 P)
  const handleDoublePointsBoost = () => {
    if (!runState || runState.scorePoints < 240) return;
    
    const updated: ExoticsRunState = {
      ...runState,
      doublePointsRemaining: 10,
      scorePoints: runState.scorePoints - 240,
    };
    
    setRunState(updated);
    saveExoticsRun(updated);
    
    setMessage('⚡ ¡Próximas 10 palabras con DOBLE PUNTOS!');
    setTimeout(() => setMessage(''), 4000);
  };

  // 8. Nuevo puzzle antes del 50% (350 P)
  const handleBuyNewPuzzle = async () => {
    if (!runState || runState.scorePoints < 350) return;
    
    const progressPercent = puzzleSolutions.length > 0
      ? runState.foundWords.length / puzzleSolutions.length
      : 0;
    
    if (progressPercent >= 0.5) {
      alert('Solo puedes comprar un nuevo heptagrama antes de alcanzar el 50% de progreso.');
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
        alert('No se pudo generar puzzle. Se devuelven los 350 P.');
        const refunded = { ...updatedWithCost, scorePoints: updatedWithCost.scorePoints + 350 };
        setRunState(refunded);
        saveExoticsRun(refunded);
        setIsGeneratingNewPuzzle(false);
        return;
      }
      
      const updated: ExoticsRunState = {
        ...updatedWithCost,
        puzzle: newPuzzle,
        foundWords: [],
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
      
      setMessage('✨ ¡Nuevo heptagrama comprado! -350 P');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      console.error('[ExoticsPlay] Error al generar puzzle:', error);
      alert('Error. Se devuelven los 350 P.');
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
      setMessage(result.reason || 'Error desconocido');
      setTimeout(() => setMessage(''), 3000);
      setClickedWord('');
      
      if (import.meta.env.DEV) {
        console.log(
          `[ExoticsPlay] Palabra rechazada: "${word}"`,
          `\nRazón: ${result.reason}`
        );
      }
      return;
    }
    
    const normalized = normalizeWord(word);
    const newFoundWords = [...runState.foundWords, normalized].sort();
    const newWordCount = newFoundWords.length;
    
    // Verificar si es SuperHepta
    const isSH = isSuperHepta(normalized);
    
    // Calcular puntos de la palabra
    let wordPoints = calculateWordPoints(normalized, isSH);
    
    // Aplicar multiplicador de doble puntos si está activo
    const hasDoublePoints = runState.doublePointsRemaining > 0;
    if (hasDoublePoints) {
      wordPoints *= 2;
    }
    
    // Verificar hito cada 10 palabras (NO se multiplica)
    const { bonus: milestoneBonus, newStreak10Count } = calculateMilestoneBonus(
      newWordCount,
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
    
    // Verificar si alcanzó el 50% y dar bonus único de +250 P
    const progressPercent = puzzleSolutions.length > 0 
      ? newWordCount / puzzleSolutions.length 
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
    
    // Verificar si alcanzó 100 palabras encontradas
    if (newWordCount >= 100 && !runState.milestones.reached100Found) {
      newMilestones.reached100Found = true;
    }
    
    // Log detallado en desarrollo
    if (import.meta.env.DEV) {
      console.log(
        `[ExoticsPlay] 📊 Palabra aceptada: "${normalized}"`,
        `\n  Longitud: ${normalized.length}`,
        `\n  SuperHepta: ${isSH}`,
        `\n  Puntos base: ${wordPoints}${isSH ? ' (incluye +60 SuperHepta)' : ''}`,
        milestoneBonus > 0 ? `\n  🎉 HITO! ${newWordCount} palabras → +${milestoneBonus} P` : '',
        bonus50Percent > 0 ? `\n  🎯 BONUS 50%! → +${bonus50Percent} P` : '',
        `\n  Total P: +${totalPointsThisWord + bonus50Percent}`,
        `\n  XP ganada: +${Math.round((totalPointsThisWord + bonus50Percent) * 0.4)}`,
        `\n  Nuevos totales: ${newScore} P, ${newXP} XP`,
        `\n  Palabras: ${newWordCount}/${runState.solutionsTotal}`,
        `\n  Progreso: ${Math.round(progressPercent * 100)}%`
      );
    }
    
    // Actualizar estado
    const updatedRun: ExoticsRunState = {
      ...runState,
      foundWords: newFoundWords,
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
    setTimeout(() => setShowSuccessAnim(false), 600);
    
    // Mensaje de feedback
    let feedbackMessage = '';
    const doubleIndicator = hasDoublePoints ? ' ⚡x2' : '';
    
    if (bonus50Percent > 0) {
      feedbackMessage = `🎯 ¡50% COMPLETADO! +${bonus50Percent} P (GRATIS disponible)`;
    } else if (milestoneBonus > 0) {
      feedbackMessage = `🎉 ¡${newWordCount} PALABRAS! +${milestoneBonus} P`;
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
    setTimeout(() => setMessage(''), bonus50Percent > 0 ? 6000 : (milestoneBonus > 0 ? 5000 : 3000));
  };

  const handleEndRun = () => {
    if (!runState) return;
    
    const progressPercent = puzzleSolutions.length > 0 
      ? (runState.foundWords.length / puzzleSolutions.length) * 100 
      : 0;
    
    const confirmMsg = `¿Terminar esta run?\n\nPuntos: ${runState.scorePoints} P\nXP acumulada: ${runState.xpEarned}\nPalabras: ${runState.foundWords.length}/${puzzleSolutions.length} (${progressPercent.toFixed(1)}%)\n\nEl XP se sumará a tu nivel global.`;
    
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
      <div className="app">
        <header className="header">
          <h1>✨ Cargando...</h1>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <button className="btn-back" onClick={onBack}>
          ← Exóticos
        </button>
        <h1>✨ Exóticos</h1>
        <div style={{ width: '70px' }} />
      </header>

      <div className="game-layout">
        {/* Panel izquierdo: Run Info */}
        <div className="exotic-run-panel">
          <h3>🎮 Run Activa</h3>
          
          {isCalculatingSolutions && (
            <div className="calculating-indicator">
              <span className="spinner">⏳</span>
              <p>Calculando soluciones...</p>
            </div>
          )}
          
          <div className="run-info-stats">
            <div className="run-info-item">
              <span className="run-info-label">Puntos (P)</span>
              <span className="run-info-value">{runState.scorePoints}</span>
            </div>
            
            <div className="run-info-item">
              <span className="run-info-label">XP Ganada</span>
              <span className="run-info-value">{runState.xpEarned}</span>
            </div>
            
            <div className="run-info-item">
              <span className="run-info-label">Letras extra</span>
              <span className="run-info-value">{runState.extraLetters.length}</span>
            </div>
          </div>

          {canChangePuzzleFree() && !isGeneratingNewPuzzle && (
            <button className="btn-change-puzzle-free" onClick={handleChangePuzzleFree}>
              ✨ Cambiar heptagrama (GRATIS)
            </button>
          )}

          {isGeneratingNewPuzzle && (
            <div className="generation-info-panel">
              <div className="spinner">⏳</div>
              <p>Generando nuevo puzzle...</p>
              <p className="generation-stats">
                Intentos: {generationProgress.attempts}<br />
                Última: {generationProgress.lastCount} palabras
              </p>
            </div>
          )}

          <button className="btn-abilities" onClick={() => setShowAbilitiesPanel(true)}>
            ⚡ Habilidades
          </button>

          <button className="btn-end-run" onClick={handleEndRun}>
            🛑 Terminar Run
          </button>

          {runState.extraLetters.length > 0 && (
            <div className="extra-letters-display">
              <h4>Letras Extra:</h4>
              <div className="extra-letters-list">
                {runState.extraLetters.map((letter, idx) => (
                  <span key={idx} className="extra-letter-badge">
                    {letter.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel central: Tablero y controles */}
        <div className="game-main">
          <div className="puzzle-header">
            <h2 className="puzzle-title">
              Encontradas: {runState.foundWords.length}
              {runState.solutionsTotal > 0 && ` / ${runState.solutionsTotal}`}
            </h2>
          </div>

          <div className="board-container">
            <HeptagramBoardSvg
              ref={heptagramRef}
              center={runState.puzzle.center}
              outer={shuffledOuter}
              onLetterClick={handleLetterClick}
              onShuffleOuter={(shuffled) => setShuffledOuter(shuffled)}
              successAnimation={showSuccessAnim}
            />
          </div>

          <WordInput
            clickedWord={clickedWord}
            message={message}
            onSubmit={handleSubmit}
            onClearClicked={handleClearClicked}
            onBackspace={handleBackspace}
            onShuffle={handleShuffle}
            successAnimation={showSuccessAnim}
          />
        </div>

        {/* Panel derecho: Lista de palabras */}
        <div className="game-sidebar">
          <FoundWordsList 
            words={runState.foundWords}
            total={puzzleSolutions.length}
            superHeptaWords={[]}
          />
          
          {lengthHints && (
            <div className="length-hints-panel">
              <h4>💡 Pistas de Longitud</h4>
              <div className="length-hints-list">
                {Object.entries(lengthHints)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([len, count]) => (
                    <div key={len} className="length-hint-item">
                      <span>{len} letras:</span>
                      <span className="hint-count">{count}</span>
                    </div>
                  ))}
              </div>
              <button 
                className="btn-close-hint" 
                onClick={() => setLengthHints(null)}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Panel de Habilidades */}
      {showAbilitiesPanel && (
        <div className="modal-overlay" onClick={() => setShowAbilitiesPanel(false)}>
          <div className="abilities-panel" onClick={(e) => e.stopPropagation()}>
            <h2>⚡ Habilidades</h2>
            <p className="abilities-balance">Tienes: {runState.scorePoints} P</p>
            
            <div className="abilities-list">
              {/* Pista longitud */}
              <button 
                className="ability-btn"
                onClick={handleLengthHint}
                disabled={runState.scorePoints < 40}
              >
                <span className="ability-icon">💡</span>
                <span className="ability-name">Pista de longitud</span>
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
              {!canChangePuzzleFree() && (
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
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Selector de Letras */}
      {showLetterSelector && letterSelectorMode && (
        <div className="modal-overlay" onClick={() => setShowLetterSelector(false)}>
          <div className="letter-selector-panel" onClick={(e) => e.stopPropagation()}>
            <h2>🔤 Selecciona una letra</h2>
            <p className="selector-cost">
              Coste: {letterSelectorMode === 'swap' ? '320 P' : '900 P'}
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
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
