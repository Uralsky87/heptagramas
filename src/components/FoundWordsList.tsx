import { useState } from 'react';
import DefinitionModal from './DefinitionModal';
import { useDefinitions } from '../lib/useDefinitions';
import { useLanguage } from '../contexts/LanguageContext';

interface FoundWordsListProps {
  words: string[];
  total: number;
  superHeptaWords: string[];
  invalidWords?: string[]; // Palabras que ya no son válidas con el set actual de letras
}

function getProgressLevel(percentage: number): string {
  if (percentage < 10) return 'game.beginner';
  if (percentage < 30) return 'game.apprentice';
  if (percentage < 60) return 'game.advanced';
  return 'game.expert';
}

export default function FoundWordsList({ words, total, superHeptaWords, invalidWords = [] }: FoundWordsListProps) {
  const { t } = useLanguage();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const { getDefinition } = useDefinitions();
  const percentage = total > 0 ? Math.round((words.length / total) * 100) : 0;
  const level = t(getProgressLevel(percentage));
  const superHeptaSet = new Set(superHeptaWords);
  const invalidSet = new Set(invalidWords);

  const handleWordClick = (word: string) => {
    const definition = getDefinition(word);
    if (definition) {
      setSelectedWord(word);
    }
  };

  const selectedDefinition = selectedWord ? getDefinition(selectedWord) : null;

  return (
    <section className="found-section">
      <div className="found-header">
        <h2>{t('game.words_found')}</h2>
        <div className="counter-group">
          <span className="counter">
            {words.length} / {total}
          </span>
          <span className="level-badge">{level}</span>
          {superHeptaWords.length > 0 && (
            <span className="superhepta-counter">
              {t('game.super_hepta')}: {superHeptaWords.length}
            </span>
          )}
        </div>
      </div>
      <p className="found-hint">{t('game.hint_click_definition')}</p>

      {words.length === 0 ? (
        <p className="empty-message">{t('game.no_words_found')}</p>
      ) : (
        <ul className="found-list">
          {words.map((word) => {
            const isInvalid = invalidSet.has(word);
            const isSuper = superHeptaSet.has(word);
            const hasDefinition = getDefinition(word);
            let className = '';
            if (isSuper) className = 'superhepta';
            if (isInvalid) className += ' invalid-word';
            if (hasDefinition) className += ' has-definition';
            
            return (
              <li 
                key={word} 
                className={className.trim()}
                onClick={() => handleWordClick(word)}
                title={hasDefinition ? t('game.hint_click_definition') : ''}
              >
                {word}
                {isSuper && <span className="star-icon"> ⭐</span>}
                {isInvalid && <span className="invalid-tag"> ({t('game.no_longer_valid')})</span>}
              </li>
            );
          })}
        </ul>
      )}

      {selectedWord && selectedDefinition && (
        <DefinitionModal
          word={selectedWord}
          definition={selectedDefinition}
          isOpen={true}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </section>
  );
}
