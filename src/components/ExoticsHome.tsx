import { useState, useEffect } from 'react';
import { loadExoticsRun, clearExoticsRun, hasActiveRun, createNewRun } from '../lib/exoticsStorage';
import { loadPlayerState, savePlayerState } from '../lib/storageAdapter';
import { calculateLevel } from '../lib/xpSystem';
import { generateExoticPuzzle } from '../lib/generateExoticPuzzle';
import type { DictionaryData } from '../lib/dictionary';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import { useLanguage } from '../contexts/LanguageContext';

interface ExoticsHomeProps {
  onBack: () => void;
  onStart: (runId: string) => void;
  dictionary: DictionaryData;
}

export default function ExoticsHome({ onBack, onStart, dictionary }: ExoticsHomeProps) {
  const { t } = useLanguage();
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
    
    const confirmMsg = t('exotic.confirm_end_run')
      .replace('{0}', String(run.scorePoints))
      .replace('{1}', String(run.xpEarned))
      .replace('{2}', String(run.foundWords.length));
    
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
          alert(t('exotic.alert_generate_invalid'));
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('[ExoticsHome] Error al generar puzzle:', error);
        alert(t('exotic.alert_generate_error'));
        setIsGenerating(false);
      }
    }
  };

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

      <div className="exotics-home-container">
        <div className="exotics-tutorial">
          <div className="exotics-tutorial-content">
            <h3 className="exotics-tutorial-title">{t('exotic.tutorial_title')}</h3>
            <div className="exotics-tutorial-list">
              <div className="tutorial-item">
                <span className="tutorial-icon">💫</span>
                <span className="tutorial-text">{t('exotic.tutorial_1')}</span>
              </div>
              <div className="tutorial-item">
                <span className="tutorial-icon">🔑</span>
                <span className="tutorial-text">{t('exotic.tutorial_2')}</span>
              </div>
              <div className="tutorial-item">
                <span className="tutorial-icon">📈</span>
                <span className="tutorial-text">{t('exotic.tutorial_3')}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="btn-start-exotic" 
          onClick={handleStartOrContinue}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="spinner">⏳</span> {t('exotic.generating')}
            </>
          ) : hasRun ? (
            t('exotic.continue_run')
          ) : (
            t('exotic.new_run')
          )}
        </button>

        {hasRun && runInfo && (
          <div className="exotics-active-run">
            <h3>{t('exotic.run_in_progress')}</h3>
            <div className="run-stats">
              <div className="run-stat">
                <span className="run-stat-label">{t('exotic.stats_words')}</span>
                <span className="run-stat-value">{runInfo.foundWords}</span>
              </div>
              <div className="run-stat">
                <span className="run-stat-label">{t('exotic.stats_points')}</span>
                <span className="run-stat-value">{runInfo.scorePoints}</span>
              </div>
              <div className="run-stat">
                <span className="run-stat-label">{t('exotic.stats_extra_letters')}</span>
                <span className="run-stat-value">{runInfo.extraLetters}</span>
              </div>
            </div>
            <button className="btn-end-run" onClick={handleEndRun}>
              {t('exotic.end_run')}
            </button>
          </div>
        )}

        {isGenerating && (
          <div className="generation-info">
            <p>{t('exotic.attempts').replace('{0}', String(generationProgress.attempts))}</p>
            <p>{t('exotic.last_solution_words').replace('{0}', String(generationProgress.lastCount))}</p>
            <p className="generation-hint">{t('exotic.generation_hint')}</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
