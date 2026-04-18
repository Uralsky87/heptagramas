import { useCallback, useEffect, useState } from 'react';
import './App.css';
import Home from './components/Home';
import Game from './components/Game';
import DailyScreen from './components/DailyScreen';
import ClassicList from './components/ClassicList';
import ExoticsHome from './components/ExoticsHome';
import ExoticsPlay from './components/ExoticsPlay';
import Settings from './components/Settings';
import UpdateBanner from './components/UpdateBanner';
import InitialLoadingScreen from './components/InitialLoadingScreen';
import { useUpdateChecker } from './lib/useUpdateChecker';
import { useLanguage } from './contexts/useLanguage';
import type { Puzzle } from './types';
import { loadDictionary, type DictionaryData } from './lib/dictionary';
import { getDailySession, getPuzzleForDailySession, preloadDailySessions } from './lib/dailySession';
import { applyTheme, getThemeById } from './lib/themes';
import { applyFont } from './lib/fonts';
import { migrateFromLocalStorage, getPlayerState, openDatabase, setPlayerState } from './storage';
import { preloadExoticsRun } from './lib/exoticsStorage';

// Importar tests solo en desarrollo (disponibles en consola)
if (import.meta.env.DEV) {
  import('./lib/testPuzzle');
  import('./lib/testExoticsStorage');
  import('./lib/testExoticsScoring');
}

type Screen = 'home' | 'daily' | 'daily-game' | 'classic' | 'classic-game' | 'exotic' | 'exotic-play' | 'settings';

interface AppHistoryState {
  screen: Screen;
  dailyDateKey?: string;
  classicPuzzleId?: string;
}

const HOME_HISTORY_STATE: AppHistoryState = { screen: 'home' };

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedClassicPuzzle, setSelectedClassicPuzzle] = useState<Puzzle | null>(null);
  const [selectedDailyDateKey, setSelectedDailyDateKey] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryData | null>(null);
  const [dictionaryLoadError, setDictionaryLoadError] = useState<string | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [navigationStack, setNavigationStack] = useState<Screen[]>(['home']);
  const { updateAvailable, isUpdating, handleUpdate } = useUpdateChecker();
  const { language, t } = useLanguage();
  const screenNeedsDictionary =
    currentScreen === 'daily' ||
    currentScreen === 'daily-game' ||
    currentScreen === 'classic' ||
    currentScreen === 'classic-game' ||
    currentScreen === 'exotic' ||
    currentScreen === 'exotic-play';

  const cleanupLocalDevCaches = async () => {
    if (!import.meta.env.DEV) {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (error) {
      console.warn('[App] No se pudieron limpiar caches locales de desarrollo:', error);
    }
  };

  const updateScreenFromHistory = useCallback((historyState: AppHistoryState | null) => {
    const nextScreen = historyState?.screen ?? 'home';

    setCurrentScreen(nextScreen);

    if (nextScreen === 'classic-game') {
      const puzzle = puzzles?.find((item) => item.id === historyState?.classicPuzzleId) ?? null;
      setSelectedClassicPuzzle(puzzle);
      setSelectedDailyDateKey(null);
      setNavigationStack(['home', 'classic', 'classic-game']);
      return;
    }

    if (nextScreen === 'daily-game') {
      setSelectedDailyDateKey(historyState?.dailyDateKey ?? null);
      setSelectedClassicPuzzle(null);
      setNavigationStack(['home', 'daily', 'daily-game']);
      return;
    }

    setSelectedClassicPuzzle(null);
    setSelectedDailyDateKey(null);

    if (nextScreen === 'classic') {
      setNavigationStack(['home', 'classic']);
      return;
    }

    if (nextScreen === 'daily') {
      setNavigationStack(['home', 'daily']);
      return;
    }

    if (nextScreen === 'exotic-play') {
      setNavigationStack(['home', 'exotic', 'exotic-play']);
      return;
    }

    if (nextScreen === 'exotic') {
      setNavigationStack(['home', 'exotic']);
      return;
    }

    if (nextScreen === 'settings') {
      setNavigationStack(['home', 'settings']);
      return;
    }

    setNavigationStack(['home']);
  }, [puzzles]);

  const pushHistoryState = (state: AppHistoryState) => {
    window.history.pushState(state, '');
  };

  const goBackOrFallback = (fallbackState: AppHistoryState) => {
    if (window.history.state?.screen && navigationStack.length > 1) {
      window.history.back();
      return;
    }

    window.history.replaceState(fallbackState, '');
    updateScreenFromHistory(fallbackState);
  };

  // Inicializar IndexedDB y migrar datos
  useEffect(() => {
    async function initialize() {
      try {
        console.log('[App] Inicializando almacenamiento...');

        // Abrir base de datos
        await openDatabase();

        // Migrar datos de localStorage si es necesario
        await migrateFromLocalStorage();

        // Cargar playerState
        const playerState = await getPlayerState();
        if (playerState) {
          await cleanupLocalDevCaches();

          if (import.meta.env.DEV && playerState.settings.activeTheme !== 'default') {
            playerState.settings.activeTheme = 'default';
            await setPlayerState(playerState);
          }

          // Guardar en cache para acceso síncrono
          (window as { __playerStateCache?: unknown }).__playerStateCache = playerState;
          // Aplicar tema
          const theme = getThemeById(playerState.settings.activeTheme);
          applyTheme(theme);
          applyFont(playerState.settings.activeFont || 'classic');
        }

        // Precargar sesiones diarias
        await preloadDailySessions();

        // Precargar exotics run
        await preloadExoticsRun();

        setIsHydrated(true);
        console.log('[App] Almacenamiento inicializado');
      } catch (error) {
        console.error('[App] Error al inicializar:', error);
        alert('Error al inicializar la aplicación. Por favor recarga la página.');
      }
    }

    initialize();
  }, []);

  // Manejar el botón "atrás" del navegador/móvil
  useEffect(() => {
    if (window.history.state === null) {
      window.history.replaceState(HOME_HISTORY_STATE, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      updateScreenFromHistory((event.state as AppHistoryState | null) ?? null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [updateScreenFromHistory]);

  // Cargar diccionario solo cuando una pantalla lo necesita
  useEffect(() => {
    if (!screenNeedsDictionary || dictionary) {
      return;
    }

    console.log('[App] Cargando diccionario en español');
    setDictionaryLoadError(null);
    loadDictionary(undefined, language)
      .then((dict) => {
        console.log('Diccionario recibido:', dict.words.length, 'palabras');
        setDictionary(dict);
      })
      .catch((err) => {
        console.error('Error al cargar diccionario:', err);
        setDictionaryLoadError(err instanceof Error ? err.message : 'Error desconocido');
      });
  }, [dictionary, language, screenNeedsDictionary]);

  // Cargar puzzles por idioma de forma lazy para reducir bundle inicial.
  useEffect(() => {
    let isCancelled = false;
    setPuzzles(null);

    async function loadPuzzlesByLanguage() {
      try {
        console.log('[App] Cargando puzzles en español');
        const module = await import('./data/puzzles.json');
        if (!isCancelled) {
          setPuzzles(module.default as Puzzle[]);
        }
      } catch (error) {
        console.error('[App] Error al cargar puzzles:', error);
        alert('Error al cargar los puzzles. Por favor recarga la página.');
      }
    }

    loadPuzzlesByLanguage();

    return () => {
      isCancelled = true;
    };
  }, [language]);

  if (screenNeedsDictionary && dictionaryLoadError) {
    return (
      <>
        <UpdateBanner
          isVisible={updateAvailable}
          isUpdating={isUpdating}
          onUpdate={handleUpdate}
        />
        <div className="app">
          <header className="header">
            <h1>Palabrarium</h1>
            <p className="puzzle-title">No se pudo cargar el diccionario.</p>
            <p className="puzzle-title">{dictionaryLoadError}</p>
          </header>
        </div>
      </>
    );
  }

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    setNavigationStack((prev) => [...prev, screen]);
    pushHistoryState({ screen });
  };

  const handleBackToHome = () => {
    goBackOrFallback(HOME_HISTORY_STATE);
  };

  const handleBackToExoticHome = () => {
    goBackOrFallback({ screen: 'exotic' });
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen('settings');
    setNavigationStack((prev) => [...prev, 'settings']);
    pushHistoryState({ screen: 'settings' });
  };

  const handleSelectClassicPuzzle = (puzzle: Puzzle) => {
    setSelectedClassicPuzzle(puzzle);
    setCurrentScreen('classic-game');
    setNavigationStack((prev) => [...prev, 'classic-game']);
    pushHistoryState({ screen: 'classic-game', classicPuzzleId: puzzle.id });
  };

  const handleBackToClassicList = () => {
    goBackOrFallback({ screen: 'classic' });
  };

  const handlePlayDaily = (dateKey: string) => {
    setSelectedDailyDateKey(dateKey);
    setCurrentScreen('daily-game');
    setNavigationStack((prev) => [...prev, 'daily-game']);
    pushHistoryState({ screen: 'daily-game', dailyDateKey: dateKey });
  };

  const handleBackToDailyList = () => {
    goBackOrFallback({ screen: 'daily' });
  };

  // Mostrar carga mientras se inicializa
  if (!isHydrated || !puzzles || (screenNeedsDictionary && !dictionary)) {
    return (
      <>
        <UpdateBanner
          isVisible={updateAvailable}
          isUpdating={isUpdating}
          onUpdate={handleUpdate}
        />
        <InitialLoadingScreen
          message={
            !isHydrated
              ? t('common.initializing')
              : screenNeedsDictionary && !dictionary
                ? t('common.loading_dictionary')
                : t('common.loading_puzzles')
          }
        />
      </>
    );
  }

  let screenContent: React.ReactNode;

  if (currentScreen === 'home') {
    screenContent = <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
  } else if (currentScreen === 'settings') {
    screenContent = <Settings onBack={handleBackToHome} />;
  } else if (currentScreen === 'daily') {
    screenContent = (
      <DailyScreen
        puzzles={puzzles}
        onPlayDaily={handlePlayDaily}
        onBack={handleBackToHome}
      />
    );
  } else if (currentScreen === 'daily-game' && selectedDailyDateKey) {
    const session = getDailySession(selectedDailyDateKey, puzzles, language);
    const puzzle = getPuzzleForDailySession(session, puzzles);

    screenContent = (
      <Game
        initialPuzzle={puzzle}
        dictionary={dictionary!}
        allPuzzles={puzzles}
        onBack={handleBackToDailyList}
        mode="daily"
        dailyProgressId={session.progressId}
        dailyDateKey={selectedDailyDateKey}
      />
    );
  } else if (currentScreen === 'classic') {
    screenContent = (
      <ClassicList
        puzzles={puzzles}
        onSelectPuzzle={handleSelectClassicPuzzle}
        onBack={handleBackToHome}
      />
    );
  } else if (currentScreen === 'classic-game' && selectedClassicPuzzle) {
    screenContent = (
      <Game
        initialPuzzle={selectedClassicPuzzle}
        dictionary={dictionary!}
        allPuzzles={puzzles}
        onBack={handleBackToClassicList}
        mode="classic"
      />
    );
  } else if (currentScreen === 'exotic') {
    screenContent = (
      <ExoticsHome
        onBack={handleBackToHome}
        onStart={(runId: string) => {
          console.log('[App] Iniciando run exótica:', runId);
          setCurrentScreen('exotic-play');
          setNavigationStack((prev) => [...prev, 'exotic-play']);
          pushHistoryState({ screen: 'exotic-play' });
        }}
        dictionary={dictionary!}
      />
    );
  } else if (currentScreen === 'exotic-play') {
    screenContent = (
      <ExoticsPlay
        onBack={handleBackToExoticHome}
        dictionary={dictionary!}
      />
    );
  } else {
    screenContent = <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
  }

  return (
    <>
      <UpdateBanner
        isVisible={updateAvailable}
        isUpdating={isUpdating}
        onUpdate={handleUpdate}
      />
      {screenContent}
    </>
  );
}
