import { useState, useEffect } from 'react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  message: string;
  clickedWord?: string;
  onBackspace?: () => void;
  onShuffle?: () => void;
  successAnimation?: boolean;
}

export default function WordInput({ onSubmit, message, clickedWord = '', onBackspace, onShuffle, successAnimation }: WordInputProps) {
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
              🔄
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
