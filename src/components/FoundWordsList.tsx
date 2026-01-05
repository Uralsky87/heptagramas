interface FoundWordsListProps {
  words: string[];
  total: number;
  superHeptaWords: string[];
}

function getProgressLevel(percentage: number): string {
  if (percentage < 10) return 'Principiante';
  if (percentage < 30) return 'Aprendiz';
  if (percentage < 60) return 'Avanzado';
  return 'Experto';
}

export default function FoundWordsList({ words, total, superHeptaWords }: FoundWordsListProps) {
  const percentage = total > 0 ? Math.round((words.length / total) * 100) : 0;
  const level = getProgressLevel(percentage);
  const superHeptaSet = new Set(superHeptaWords);

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
          {words.map((word) => (
            <li key={word} className={superHeptaSet.has(word) ? 'superhepta' : ''}>
              {word}
              {superHeptaSet.has(word) && <span className="star-icon"> ⭐</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
