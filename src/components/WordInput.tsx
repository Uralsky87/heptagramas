interface WordInputProps {
  onSubmit: (word: string) => void;
  message: string;
  clickedWord?: string;
  onBackspace?: () => void;
  onShuffle?: () => void;
  onDeleteLetter?: () => void;
  successAnimation?: boolean;
}

export default function WordInput({
  onSubmit,
  message,
  clickedWord = '',
  onBackspace,
  onShuffle,
  onDeleteLetter,
  successAnimation,
}: WordInputProps) {
  const inputValue = clickedWord;

  const handleSubmit = () => {
    const wordToSubmit = inputValue.trim();
    if (wordToSubmit) {
      onSubmit(wordToSubmit);
    }
  };

  const handleDeleteLetter = () => {
    if (inputValue.length > 0) {
      onDeleteLetter?.();
    } else if (clickedWord.length > 0) {
      onBackspace?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace') {
      if (inputValue.length === 0 && clickedWord.length > 0) {
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
            value={inputValue}
            onKeyDown={handleKeyDown}
            placeholder="Haz clic en las letras..."
            className={`word-input ${successAnimation ? 'success-flash' : ''}`}
            readOnly
          />
          <button
            onClick={handleDeleteLetter}
            className="btn-delete-letter"
            title="Borrar ultima letra"
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
