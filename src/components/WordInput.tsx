import type { KeyboardEvent } from 'react';
import type { FeedbackTone } from '../lib/feedback';
import { useLanguage } from '../contexts/useLanguage';

interface WordInputProps {
  onSubmit: (word: string) => void;
  message: string;
  messageTone?: FeedbackTone;
  clickedWord?: string;
  onBackspace?: () => void;
  onShuffle?: () => void;
  onDeleteLetter?: () => void;
  successAnimation?: boolean;
  errorAnimation?: boolean;
  submitPulseTone?: 'success' | 'error' | null;
}

export default function WordInput({
  onSubmit,
  message,
  messageTone = 'neutral',
  clickedWord = '',
  onBackspace,
  onShuffle,
  onDeleteLetter,
  successAnimation,
  errorAnimation,
  submitPulseTone,
}: WordInputProps) {
  const { t } = useLanguage();
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace' && inputValue.length === 0 && clickedWord.length > 0) {
      e.preventDefault();
      onBackspace?.();
    }
  };

  const containerClassName = [
    'input-container',
    successAnimation ? 'success-pulse' : '',
    errorAnimation ? 'error-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClassName = [
    'word-input',
    successAnimation ? 'success-flash' : '',
    errorAnimation ? 'error-flash' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const submitClassName = [
    'btn-action',
    'btn-submit',
    submitPulseTone === 'success' ? 'submit-success-pop' : '',
    submitPulseTone === 'error' ? 'submit-error-pop' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="input-section">
      <div className={containerClassName}>
        <div className="input-with-delete">
          <input
            type="text"
            value={inputValue}
            onKeyDown={handleKeyDown}
            placeholder={t('game.input_placeholder')}
            className={inputClassName}
            readOnly
          />
          <button
            onClick={handleDeleteLetter}
            className="btn-delete-letter"
            title={t('common.clear')}
          >
            ⌫
          </button>
        </div>
        <div className="button-row">
          {onShuffle && (
            <button onClick={onShuffle} className="btn-action btn-shuffle-inline" title={t('common.shuffle')}>
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
          <button onClick={handleSubmit} className={submitClassName}>
            {t('common.submit')}
          </button>
        </div>
      </div>

      {message && <p className={`message message-${messageTone}`}>{message}</p>}
    </section>
  );
}
