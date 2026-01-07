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
  const percentage = total > 0 ? Math.round((words.length / total) * 100) : 0;
  const level = getProgressLevel(percentage);
  const superHeptaSet = new Set(superHeptaWords);
  const invalidSet = new Set(invalidWords);

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

      {words.length === 0 ? (
        <p className="empty-message">Aún no has encontrado ninguna palabra.</p>
      ) : (
        <ul className="found-list">
          {words.map((word) => {
            const isInvalid = invalidSet.has(word);
            const isSuper = superHeptaSet.has(word);
            let className = '';
            if (isSuper) className = 'superhepta';
            if (isInvalid) className += ' invalid-word';
            
            return (
              <li key={word} className={className.trim()}>
                {word}
                {isSuper && <span className="star-icon"> ⭐</span>}
                {isInvalid && <span className="invalid-tag"> (ya no válida)</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
