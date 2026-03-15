import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { t } = useLanguage();
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
          title={t('exotic.toggle_title')}
        >
          {t('exotic.toggle_button')}
          {isActive && currentLetter && <span className="exotic-letter-badge">{currentLetter.toUpperCase()}</span>}
        </button>
        {isActive && (
          <div className="exotic-warning">
            {t('exotic.toggle_warning')}
          </div>
        )}
      </div>

      {showSelector && (
        <div className="exotic-selector-overlay" onClick={handleCancel}>
          <div className="exotic-selector-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('exotic.select_extra_letter')}</h3>
            <p className="exotic-selector-hint">
              {t('exotic.selector_hint_line1')}
              <br />{t('exotic.selector_hint_line2')}
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
              {t('settings.cancel_btn')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
