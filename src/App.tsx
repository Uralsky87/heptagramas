import { useEffect, useState } from 'react';
import './App.css';
import Home from './components/Home';
import Game from './components/Game';
import DailyScreen from './components/DailyScreen';
import ClassicList from './components/ClassicList';
import ExoticsHome from './components/ExoticsHome';
import ExoticsPlay from './components/ExoticsPlay';
import Settings from './components/Settings';
import UpdateBanner from './components/UpdateBanner';
import { useUpdateChecker } from './lib/useUpdateChecker';
import { useLanguage } from './contexts/LanguageContext';
import type { Puzzle } from './types';
import { loadDictionary, type DictionaryData } from './lib/dictionary';
import { getDailySession, getDailyPuzzleForDate, preloadDailySessions } from './lib/dailySession';
import { applyTheme, getThemeById } from './lib/themes';
import { migrateFromLocalStorage, getPlayerState, openDatabase } from './storage';
import { preloadExoticsRun } from './lib/exoticsStorage';
import puzzlesData from './data/puzzles.json';
import puzzlesEnData from './data/puzzles_en.json';

// Importar función de test (disponible en consola como testPuzzle())
import './lib/testPuzzle';
// Importar test de Exotics Storage (disponible en consola como testExoticsStorage())
import './lib/testExoticsStorage';
// Importar test de Exotics Scoring (disponible en consola como testExoticsScoring())
import './lib/testExoticsScoring';

const PUZZLES_ES: Puzzle[] = puzzlesData as Puzzle[];
const PUZZLES_EN: Puzzle[] = puzzlesEnData as Puzzle[];

type Screen = 'home' | 'daily' | 'daily-game' | 'classic' | 'classic-game' | 'exotic' | 'exotic-play' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedClassicPuzzle, setSelectedClassicPuzzle] = useState<Puzzle | null>(null);
  const [selectedDailyDateKey, setSelectedDailyDateKey] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryData | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [navigationStack, setNavigationStack] = useState<Screen[]>(['home']);
  const { updateAvailable, isUpdating, handleUpdate } = useUpdateChecker();
  const { language } = useLanguage();
  const puzzles = language === 'en' ? PUZZLES_EN : PUZZLES_ES;

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

  // Manejar el botón "atrás" del navegador/móvil
  useEffect(() => {
    // Agregar una entrada inicial al historial del navegador
    if (window.history.state === null) {
      window.history.replaceState({ screen: 'home' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      
      // Si estamos en home, permitir salir de la app
      if (currentScreen === 'home') {
        return;
      }
      
      // En cualquier otra pantalla, navegar hacia atrás dentro de la app
      if (navigationStack.length > 1) {
        const newStack = [...navigationStack];
        newStack.pop(); // Eliminar pantalla actual
        const previousScreen = newStack[newStack.length - 1];
        
        setNavigationStack(newStack);
        setCurrentScreen(previousScreen);
        
        // Agregar nueva entrada al historial del navegador
        window.history.pushState({ screen: previousScreen }, '');
        
        // Limpiar estados según la pantalla a la que volvemos
        if (previousScreen === 'home') {
          setSelectedDailyDateKey(null);
          setSelectedClassicPuzzle(null);
        } else if (previousScreen === 'classic') {
          setSelectedClassicPuzzle(null);
        } else if (previousScreen === 'daily') {
          setSelectedDailyDateKey(null);
        }
      } else {
        // Si solo queda home en el stack, ir a home
        setCurrentScreen('home');
        setSelectedDailyDateKey(null);
        setSelectedClassicPuzzle(null);
        setNavigationStack(['home']);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentScreen, navigationStack]);

  // Cargar diccionario al iniciar o cambiar idioma
  useEffect(() => {
    console.log(`[App] Cargando diccionario en idioma: ${language}`);
    loadDictionary(undefined, language)
      .then(dict => {
        console.log('Diccionario recibido:', dict.words.length, 'palabras');
        setDictionary(dict);
      })
      .catch(err => {
        console.error('Error al cargar diccionario:', err);
        alert('Error al cargar el diccionario. Revisa la consola.');
      });
  }, [language]);

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
    setNavigationStack([...navigationStack, screen]);
    window.history.pushState({ screen }, '');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedDailyDateKey(null);
    setNavigationStack(['home']);
    window.history.pushState({ screen: 'home' }, '');
  };

  const handleBackToExoticHome = () => {
    setCurrentScreen('exotic');
    // Mantener el stack hasta exotic
    const exoticIndex = navigationStack.indexOf('exotic');
    if (exoticIndex !== -1) {
      setNavigationStack(navigationStack.slice(0, exoticIndex + 1));
    } else {
      setNavigationStack(['home', 'exotic']);
    }
    window.history.pushState({ screen: 'exotic' }, '');
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen('settings');
    setNavigationStack([...navigationStack, 'settings']);
    window.history.pushState({ screen: 'settings' }, '');
  };

  const handleSelectClassicPuzzle = (puzzle: Puzzle) => {
    setSelectedClassicPuzzle(puzzle);
    setCurrentScreen('classic-game');
    setNavigationStack([...navigationStack, 'classic-game']);
    window.history.pushState({ screen: 'classic-game' }, '');
  };

  const handleBackToClassicList = () => {
    setCurrentScreen('classic');
    setSelectedClassicPuzzle(null);
    // Mantener el stack hasta classic
    const classicIndex = navigationStack.indexOf('classic');
    if (classicIndex !== -1) {
      setNavigationStack(navigationStack.slice(0, classicIndex + 1));
    } else {
      setNavigationStack(['home', 'classic']);
    }
    window.history.pushState({ screen: 'classic' }, '');
  };

  const handlePlayDaily = (dateKey: string) => {
    setSelectedDailyDateKey(dateKey);
    setCurrentScreen('daily-game');
    setNavigationStack([...navigationStack, 'daily-game']);
    window.history.pushState({ screen: 'daily-game' }, '');
  };

  const handleBackToDailyList = () => {
    setCurrentScreen('daily');
    setSelectedDailyDateKey(null);
    setSelectedClassicPuzzle(null);
    // Mantener el stack hasta daily
    const dailyIndex = navigationStack.indexOf('daily');
    if (dailyIndex !== -1) {
      setNavigationStack(navigationStack.slice(0, dailyIndex + 1));
    } else {
      setNavigationStack(['home', 'daily']);
    }
    window.history.pushState({ screen: 'daily' }, '');
  };

  // Mostrar carga mientras se inicializa
  if (!isHydrated || !dictionary) {
    return (
      <>
        <UpdateBanner 
          isVisible={updateAvailable}
          isUpdating={isUpdating}
          onUpdate={handleUpdate}
        />
        <div className="app">
          <header className="header">
            <h1>🌟 Heptagramas</h1>
            <p className="puzzle-title">
              {!isHydrated ? 'Inicializando almacenamiento...' : 'Cargando diccionario...'}
            </p>
          </header>
        </div>
      </>
    );
  }

  // Preparar el contenido según la pantalla actual
  let screenContent: React.ReactNode;

  // Pantalla Home
  if (currentScreen === 'home') {
    screenContent = <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
  }

  // Pantalla Settings
  else if (currentScreen === 'settings') {
    screenContent = <Settings onBack={handleBackToHome} />;
  }

  // Pantalla DailyScreen (lista de diarios)
  else if (currentScreen === 'daily') {
    screenContent = (
      <DailyScreen 
        puzzles={puzzles}
        dictionary={dictionary}
        onPlayDaily={handlePlayDaily}
        onBack={handleBackToHome}
      />
    );
  }

  // Juego Diario específico
  else if (currentScreen === 'daily-game' && selectedDailyDateKey) {
    const session = getDailySession(selectedDailyDateKey, puzzles, language);
    const puzzle = getDailyPuzzleForDate(selectedDailyDateKey, puzzles);
    
    screenContent = (
      <Game 
        initialPuzzle={puzzle}
        dictionary={dictionary}
        allPuzzles={puzzles}
        onBack={handleBackToDailyList}
        mode="daily"
        dailyProgressId={session.progressId}
      />
    );
  }

  // Pantalla ClassicList
  else if (currentScreen === 'classic') {
    screenContent = (
      <ClassicList 
        puzzles={puzzles}
        dictionary={dictionary}
        onSelectPuzzle={handleSelectClassicPuzzle}
        onBack={handleBackToHome}
      />
    );
  }

  // Juego Clásico específico
  else if (currentScreen === 'classic-game' && selectedClassicPuzzle) {
    screenContent = (
      <Game 
        initialPuzzle={selectedClassicPuzzle}
        dictionary={dictionary}
        allPuzzles={puzzles}
        onBack={handleBackToClassicList}
        mode="classic"
      />
    );
  }

  // Pantalla Exotic (nueva home de exóticos)
  else if (currentScreen === 'exotic') {
    screenContent = (
      <ExoticsHome 
        onBack={handleBackToHome}
        onStart={(runId: string) => {
          console.log('[App] Iniciando run exótica:', runId);
          setCurrentScreen('exotic-play');
          setNavigationStack([...navigationStack, 'exotic-play']);
          window.history.pushState({ screen: 'exotic-play' }, '');
        }}
        dictionary={dictionary}
      />
    );
  }

  // Pantalla Exotic Play (gameplay)
  else if (currentScreen === 'exotic-play') {
    screenContent = (
      <ExoticsPlay 
        onBack={handleBackToExoticHome}
        dictionary={dictionary}
      />
    );
  }

  // Por defecto, mostrar Home
  else {
    screenContent = <Home onNavigate={handleNavigate} onNavigateToSettings={handleNavigateToSettings} />;
  }

  // Retornar con UpdateBanner envolviendo todo
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
