import { useState, useEffect } from 'react';
import { loadExoticsRun, clearExoticsRun, hasActiveRun, createNewRun } from '../lib/exoticsStorage';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { calculateLevel } from '../lib/xpSystem';
import { generateExoticPuzzle } from '../lib/generateExoticPuzzle';
import type { DictionaryData } from '../lib/dictionary';
import PageContainer from './layout/PageContainer';

interface ExoticsHomeProps {
  onBack: () => void;
  onStart: (runId: string) => void;
  dictionary: DictionaryData;
}

export default function ExoticsHome({ onBack, onStart, dictionary }: ExoticsHomeProps) {
  const [hasRun, setHasRun] = useState(false);
  const [runInfo, setRunInfo] = useState<{
    foundWords: number;
    scorePoints: number;
    extraLetters: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ attempts: 0, lastCount: 0 });

  useEffect(() => {
    const active = hasActiveRun();
    setHasRun(active);
    
    if (active) {
      const run = loadExoticsRun();
      if (run) {
        setRunInfo({
          foundWords: run.foundWords.length,
          scorePoints: run.scorePoints,
          extraLetters: run.extraLetters.length,
        });
      }
    }
  }, []);

  const handleEndRun = () => {
    const run = loadExoticsRun();
    
    if (!run) {
      setHasRun(false);
      setRunInfo(null);
      return;
    }
    
    const confirmMsg = `¿Terminar esta run?\n\nPuntos: ${run.scorePoints} P\nXP acumulada: ${run.xpEarned}\nPalabras: ${run.foundWords.length}\n\nEl XP se sumará a tu nivel global.`;
    
    if (confirm(confirmMsg)) {
      // Sumar XP al playerState global
      const playerState = loadPlayerState();
      const oldXP = playerState.xpTotal;
      const oldLevel = playerState.level;
      
      playerState.xpTotal += run.xpEarned;
      playerState.level = calculateLevel(playerState.xpTotal);
      
      savePlayerState(playerState);
      
      if (import.meta.env.DEV) {
        console.log('[ExoticsHome] Run terminada por el usuario');
        console.log(`[ExoticsHome] XP ganada: +${run.xpEarned} (${oldXP} → ${playerState.xpTotal})`);
        console.log(`[ExoticsHome] Nivel: ${oldLevel} → ${playerState.level}`);
      }
      
      // Limpiar run
      clearExoticsRun();
      setHasRun(false);
      setRunInfo(null);
    }
  };

  const handleStartOrContinue = async () => {
    if (hasRun) {
      // Continuar run existente
      const run = loadExoticsRun();
      if (run) {
        onStart(run.runId);
      }
    } else {
      // Generar nuevo puzzle
      setIsGenerating(true);
      setGenerationProgress({ attempts: 0, lastCount: 0 });
      
      try {
        const puzzle = await generateExoticPuzzle(
          dictionary,
          (attempts, lastCount) => {
            setGenerationProgress({ attempts, lastCount });
          }
        );
        
        if (puzzle) {
          // Crear nueva run con el puzzle generado
          const newRun = createNewRun(puzzle);
          
          if (import.meta.env.DEV) {
            console.log('[ExoticsHome] Nueva run creada:', newRun.runId);
          }
          
          onStart(newRun.runId);
        } else {
          // No se pudo generar puzzle
          alert('No se pudo generar un puzzle válido. Por favor intenta de nuevo.');
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('[ExoticsHome] Error al generar puzzle:', error);
        alert('Error al generar puzzle. Por favor intenta de nuevo.');
        setIsGenerating(false);
      }
    }
  };

  return (
    <PageContainer>
      <header className="header">
        <button className="btn-back" onClick={onBack}>
          ← Inicio
        </button>
        <h1>✨ Modo Exótico</h1>
        <div style={{ width: '70px' }} />
      </header>

      <div className="exotics-home-container">
        <div className="exotics-hero">
          <div className="exotics-icon">✨</div>
          <h2>Modo Exótico</h2>
        </div>

        <div className="exotics-features">
          <div className="exotics-feature">
            <span className="feature-icon">🎯</span>
            <h3>8 Letras</h3>
            <p>Centro + 6 exteriores + 1 extra</p>
          </div>
          <div className="exotics-feature">
            <span className="feature-icon">📚</span>
            <h3>Más Palabras</h3>
            <p>Muchas más combinaciones posibles</p>
          </div>
          <div className="exotics-feature">
            <span className="feature-icon">⭐</span>
            <h3>Mayor Desafío</h3>
            <p>Encuentra todas las soluciones</p>
          </div>
        </div>

        {hasRun && runInfo && (
          <div className="exotics-active-run">
            <h3>🎮 Run en progreso</h3>
            <div className="run-stats">
              <div className="run-stat">
                <span className="run-stat-label">Palabras</span>
                <span className="run-stat-value">{runInfo.foundWords}</span>
              </div>
              <div className="run-stat">
                <span className="run-stat-label">Puntos</span>
                <span className="run-stat-value">{runInfo.scorePoints}</span>
              </div>
              <div className="run-stat">
                <span className="run-stat-label">Letras extra</span>
                <span className="run-stat-value">{runInfo.extraLetters}</span>
              </div>
            </div>
            <button className="btn-end-run" onClick={handleEndRun}>
              🛑 Terminar Run
            </button>
          </div>
        )}

        <button 
          className="btn-start-exotic" 
          onClick={handleStartOrContinue}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner">⏳</span> Generando puzzle...
            </>
          ) : hasRun ? (
            '▶️ Continuar Run'
          ) : (
            '🚀 Iniciar Nueva Run'
          )}
        </button>

        {isGenerating && (
          <div className="generation-info">
            <p>Intentos: {generationProgress.attempts}</p>
            <p>Última solución: {generationProgress.lastCount} palabras</p>
            <p className="generation-hint">Buscando puzzle con 50-500 soluciones...</p>
          </div>
        )}

        <div className="exotics-note">
          <strong>Nota:</strong> En construcción. Próximamente podrás seleccionar puzzles exóticos.
        </div>
      </div>
    </PageContainer>
  );
}
