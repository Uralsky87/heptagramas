import { useEffect, useState } from 'react';
import './App.css';
import Home from './components/Home';
import Game from './components/Game';
import DailyScreen from './components/DailyScreen';
import ClassicList from './components/ClassicList';
import ExoticsHome from './components/ExoticsHome';
import ExoticsPlay from './components/ExoticsPlay';
import Settings from './components/Settings';
import type { Puzzle } from './types';
import { loadDictionary, type DictionaryData } from './lib/dictionary';
import { getDailySession, getDailyPuzzleForDate, preloadDailySessions } from './lib/dailySession';
import { applyTheme, getThemeById } from './lib/themes';
import { migrateFromLocalStorage, getPlayerState, openDatabase } from './storage';
import { preloadExoticsRun } from './lib/exoticsStorage';
import puzzlesData from './data/puzzles.json';

// Importar función de test (disponible en consola como testPuzzle())
import './lib/testPuzzle';
// Importar test de Exotics Storage (disponible en consola como testExoticsStorage())
import './lib/testExoticsStorage';
// Importar test de Exotics Scoring (disponible en consola como testExoticsScoring())
import './lib/testExoticsScoring';

const PUZZLES: Puzzle[] = puzzlesData as Puzzle[];

type Screen = 'home' | 'daily' | 'daily-game' | 'classic' | 'classic-game' | 'exotic' | 'exotic-play' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedClassicPuzzle, setSelectedClassicPuzzle] = useState<Puzzle | null>(null);
  const [selectedDailyDateKey, setSelectedDailyDateKey] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

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
          // Guardar en cache para acceso síncrono
          (window as any).__playerStateCache = playerState;
          
          // Aplicar tema
          const theme = getThemeById(playerState.settings.activeTheme);
          applyTheme(theme);
        }
        
        // Precargar sesiones diarias
        await preloadDailySessions();
        
        // Precargar exotics run
        await preloadExoticsRun();
        
        setIsHydrated(true);
        console.log('[App] ✓ Almacenamiento inicializado');
      } catch (error) {
        console.error('[App] Error al inicializar:', error);
        alert('Error al inicializar la aplicación. Por favor recarga la página.');
      }
    }
    
    initialize();
  }, []);

  // Cargar diccionario al iniciar
  useEffect(() => {
    console.log('Componente montado, cargando diccionario...');
    loadDictionary()
      .then(dict => {
        console.log('Diccionario recibido:', dict.words.length, 'palabras');
        setDictionary(dict);
      })
      .catch(err => {
        console.error('Error al cargar diccionario:', err);
        alert('Error al cargar el diccionario. Revisa la consola.');
      });
  }, []);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedDailyDateKey(null);
  };

  const handleBackToExoticHome = () => {
    setCurrentScreen('exotic');
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const handleSelectClassicPuzzle = (puzzle: Puzzle) => {
    setSelectedClassicPuzzle(puzzle);
    setCurrentScreen('classic-game');
  };

  const handleBackToClassicList = () => {
    setCurrentScreen('classic');
    setSelectedClassicPuzzle(null);
  };

  const handlePlayDaily = (dateKey: string) => {
    setSelectedDailyDateKey(dateKey);
    setCurrentScreen('daily-game');
  };

  const handleBackToDailyList = () => {
    setCurrentScreen('daily');
    setSelectedDailyDateKey(null);
    setSelectedClassicPuzzle(null);
  };

  // Mostrar carga mientras se inicializa
  if (!isHydrated || !dictionary) {
    return (
      <div className="app">
        <header className="header">
          <h1>🌟 Heptagramas</h1>
          <p className="puzzle-title">
            {!isHydrated ? 'Inicializando almacenamiento...' : 'Cargando diccionario...'}
          </p>
        </header>
      </div>
    );
  }

  // Pantalla Home
  if (currentScreen === 'home') {
    return <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
  }

  // Pantalla Settings
  if (currentScreen === 'settings') {
    return <Settings onBack={handleBackToHome} />;
  }

  // Pantalla DailyScreen (lista de diarios)
  if (currentScreen === 'daily') {
    return (
      <DailyScreen 
        puzzles={PUZZLES}
        dictionary={dictionary}
        onPlayDaily={handlePlayDaily}
        onBack={handleBackToHome}
      />
    );
  }

  // Juego Diario específico
  if (currentScreen === 'daily-game' && selectedDailyDateKey) {
    const session = getDailySession(selectedDailyDateKey, PUZZLES);
    const puzzle = getDailyPuzzleForDate(selectedDailyDateKey, PUZZLES);
    
    return (
      <Game 
        initialPuzzle={puzzle}
        dictionary={dictionary}
        allPuzzles={PUZZLES}
        onBack={handleBackToDailyList}
        mode="daily"
        dailyProgressId={session.progressId}
      />
    );
  }

  // Pantalla ClassicList
  if (currentScreen === 'classic') {
    return (
      <ClassicList 
        puzzles={PUZZLES}
        dictionary={dictionary}
        onSelectPuzzle={handleSelectClassicPuzzle}
        onBack={handleBackToHome}
      />
    );
  }

  // Juego Clásico específico
  if (currentScreen === 'classic-game' && selectedClassicPuzzle) {
    return (
      <Game 
        initialPuzzle={selectedClassicPuzzle}
        dictionary={dictionary}
        allPuzzles={PUZZLES}
        onBack={handleBackToClassicList}
        mode="classic"
      />
    );
  }

  // Pantalla Exotic (nueva home de exóticos)
  if (currentScreen === 'exotic') {
    return (
      <ExoticsHome 
        onBack={handleBackToHome}
        onStart={(runId: string) => {
          console.log('[App] Iniciando run exótica:', runId);
          setCurrentScreen('exotic-play');
        }}
        dictionary={dictionary}
      />
    );
  }

  // Pantalla Exotic Play (gameplay)
  if (currentScreen === 'exotic-play') {
    return (
      <ExoticsPlay 
        onBack={handleBackToExoticHome}
        dictionary={dictionary}
      />
    );
  }

  return <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
}
