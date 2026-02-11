import { useState, useEffect } from 'react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  message: string;
  clickedWord?: string;
  onBackspace?: () => void;
  onShuffle?: () => void;
  onDeleteLetter?: () => void;
  successAnimation?: boolean;
}

export default function WordInput({ onSubmit, message, clickedWord = '', onBackspace, onShuffle, onDeleteLetter, successAnimation }: WordInputProps) {
  const [input, setInput] = useState('');

  // Sincronizar input con palabra clickeada
  useEffect(() => {
    if (clickedWord) {
      setInput(clickedWord);
    }
  }, [clickedWord]);

  const handleSubmit = () => {
    const wordToSubmit = input.trim();
    if (wordToSubmit) {
      onSubmit(wordToSubmit);
      setInput('');
    }
  };

  const handleDeleteLetter = () => {
    if (input.length > 0) {
      // Borrar la última letra del input
      setInput(input.slice(0, -1));
      // También llamar al callback del padre para actualizar clickedWord
      onDeleteLetter?.();
    } else if (clickedWord.length > 0) {
      // Si el input está vacío pero hay palabra clickeada, borrar de ahí
      onBackspace?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      // Si el input tiene contenido, dejar que funcione normalmente
      // Si está vacío y hay palabra clickeada, borrar de la palabra clickeada
      if (input.length === 0 && clickedWord.length > 0) {
        e.preventDefault();
        onBackspace?.();
      }
    }
  };

  return (
    <section className="input-section">
      <div className={`input-container ${successAnimation ? 'success-pulse' : ''}`}>
        <div className="input-with-delete">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Haz clic en las letras..."
            className={`word-input ${successAnimation ? 'success-flash' : ''}`}
            readOnly
          />
          <button 
            onClick={handleDeleteLetter}
            className="btn-delete-letter"
            title="Borrar última letra"
          >
            ⌫
          </button>
        </div>
        <div className="button-row">
          {onShuffle && (
            <button onClick={onShuffle} className="btn-action btn-shuffle-inline" title="Reordenar">
              <svg className="shuffle-icon" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M12 24A12 12 0 0 1 30 14" />
                <path d="M30 14L26 12" />
                <path d="M30 14L28 18" />
                <path d="M36 24A12 12 0 0 1 18 34" />
                <path d="M18 34L22 36" />
                <path d="M18 34L20 30" />
              </svg>
            </button>
          )}
          <button onClick={handleSubmit} className="btn-action btn-submit">
            Enviar
          </button>
        </div>
      </div>

      {message && <p className="message">{message}</p>}
    </section>
  );
}
