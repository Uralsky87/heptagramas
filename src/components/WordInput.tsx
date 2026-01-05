import { useState, useEffect } from 'react';

interface WordInputProps {
  onSubmit: (word: string) => void;
  message: string;
  clickedWord?: string;
  onClearClicked?: () => void;
  onBackspace?: () => void;
  successAnimation?: boolean;
}

export default function WordInput({ onSubmit, message, clickedWord = '', onClearClicked, onBackspace, successAnimation }: WordInputProps) {
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

  const handleClear = () => {
    setInput('');
    onClearClicked?.();
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe o haz clic en las letras..."
          className={`word-input ${successAnimation ? 'success-flash' : ''}`}
        />
        <div className="button-row">
          <button onClick={handleSubmit} className="btn-action btn-submit">
            Enviar
          </button>
          {input && (
            <button onClick={handleClear} className="btn-action btn-clear">
              Borrar
            </button>
          )}
        </div>
      </div>

      {message && <p className="message">{message}</p>}
    </section>
  );
}
