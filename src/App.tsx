import { useEffect, useState } from 'react';
import './App.css';
import Home from './components/Home';
import Game from './components/Game';
import DailyScreen from './components/DailyScreen';
import ClassicList from './components/ClassicList';
import ExoticPlaceholder from './components/ExoticPlaceholder';
import type { Puzzle } from './types';
import { loadDictionary, type DictionaryData } from './lib/dictionary';
import { getDailySession, getDailyPuzzleForDate } from './lib/dailySession';
import { loadPlayerState } from './lib/storage';
import { applyTheme, getThemeById } from './lib/themes';
import puzzlesData from './data/puzzles.json';

// Importar función de test (disponible en consola como testPuzzle())
import './lib/testPuzzle';

const PUZZLES: Puzzle[] = puzzlesData as Puzzle[];

type Screen = 'home' | 'daily' | 'daily-game' | 'classic' | 'classic-game' | 'exotic';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedClassicPuzzle, setSelectedClassicPuzzle] = useState<Puzzle | null>(null);
  const [selectedDailyDateKey, setSelectedDailyDateKey] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryData | null>(null);

  // Aplicar tema guardado al iniciar
  useEffect(() => {
    const playerState = loadPlayerState();
    const theme = getThemeById(playerState.settings.activeTheme);
    applyTheme(theme);
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

  // Mostrar carga mientras se procesa el diccionario
  if (!dictionary) {
    return (
      <div className="app">
        <header className="header">
          <h1>🌟 Heptagramas</h1>
          <p className="puzzle-title">Cargando diccionario...</p>
        </header>
      </div>
    );
  }

  // Pantalla Home
  if (currentScreen === 'home') {
    return <Home onNavigate={handleNavigate} />;
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

  // Pantalla Exotic (placeholder)
  if (currentScreen === 'exotic') {
    return <ExoticPlaceholder onBack={handleBackToHome} />;
  }

  return <Home onNavigate={handleNavigate} />;
}
