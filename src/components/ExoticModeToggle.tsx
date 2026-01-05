import { useState } from 'react';

interface ExoticModeToggleProps {
  isActive: boolean;
  currentLetter: string | null;
  usedLetters: string[]; // center + outer
  onToggle: (letter: string | null) => void;
}

export default function ExoticModeToggle({
  isActive,
  currentLetter,
  usedLetters,
  onToggle,
}: ExoticModeToggleProps) {
  const [showSelector, setShowSelector] = useState(false);

  // Generar letras disponibles (a-z excepto las ya usadas)
  const availableLetters = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter(letter => !usedLetters.includes(letter));

  const handleToggle = () => {
    if (isActive) {
      // Desactivar modo exótico
      onToggle(null);
      setShowSelector(false);
    } else {
      // Mostrar selector
      setShowSelector(true);
    }
  };

  const handleSelectLetter = (letter: string) => {
    onToggle(letter);
    setShowSelector(false);
  };

  const handleCancel = () => {
    setShowSelector(false);
  };

  return (
    <>
      <div className="exotic-toggle-container">
        <button
          className={`btn-exotic ${isActive ? 'active' : ''}`}
          onClick={handleToggle}
          title="Modo Exótico: añade 1 letra extra"
        >
          ✨ Exótico
          {isActive && currentLetter && <span className="exotic-letter-badge">{currentLetter.toUpperCase()}</span>}
        </button>
        {isActive && (
          <div className="exotic-warning">
            ⚠️ Total de palabras aumentará considerablemente
          </div>
        )}
      </div>

      {showSelector && (
        <div className="exotic-selector-overlay" onClick={handleCancel}>
          <div className="exotic-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Selecciona letra extra</h3>
            <p className="exotic-selector-hint">
              Añade una letra al conjunto permitido (8 letras total).
              <br />La letra central sigue siendo obligatoria.
            </p>
            
            <div className="exotic-letters-grid">
              {availableLetters.map((letter) => (
                <button
                  key={letter}
                  className="exotic-letter-btn"
                  onClick={() => handleSelectLetter(letter)}
                >
                  {letter.toUpperCase()}
                </button>
              ))}
            </div>

            <button className="btn-secondary" onClick={handleCancel}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
