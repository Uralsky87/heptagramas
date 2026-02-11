import { useState } from 'react';
import DefinitionModal from './DefinitionModal';
import { useDefinitions } from '../lib/useDefinitions';

interface FoundWordsListProps {
  words: string[];
  total: number;
  superHeptaWords: string[];
  invalidWords?: string[]; // Palabras que ya no son válidas con el set actual de letras
}

function getProgressLevel(percentage: number): string {
  if (percentage < 10) return 'Principiante';
  if (percentage < 30) return 'Aprendiz';
  if (percentage < 60) return 'Avanzado';
  return 'Experto';
}

export default function FoundWordsList({ words, total, superHeptaWords, invalidWords = [] }: FoundWordsListProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const { getDefinition } = useDefinitions();
  const percentage = total > 0 ? Math.round((words.length / total) * 100) : 0;
  const level = getProgressLevel(percentage);
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
        <h2>Palabras encontradas</h2>
        <div className="counter-group">
          <span className="counter">
            {words.length} / {total}
          </span>
          <span className="level-badge">{level}</span>
          {superHeptaWords.length > 0 && (
            <span className="superhepta-counter">
              ⭐ SuperHeptas: {superHeptaWords.length}
            </span>
          )}
        </div>
      </div>
      <p className="found-hint">Haz click para ver la definición</p>

      {words.length === 0 ? (
        <p className="empty-message">Aún no has encontrado ninguna palabra.</p>
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
                title={hasDefinition ? 'Haz clic para ver la definición' : ''}
              >
                {word}
                {isSuper && <span className="star-icon"> ⭐</span>}
                {isInvalid && <span className="invalid-tag"> (ya no válida)</span>}
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
