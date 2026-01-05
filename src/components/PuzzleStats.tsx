import { getStartLetterCounts, getLen7PlusCount } from '../lib/stats';

interface PuzzleStatsProps {
  letters: string[]; // 7 letras del puzzle (center + outer), ya normalizadas
  solutions: string[]; // Lista completa de soluciones válidas
}

export default function PuzzleStats({ letters, solutions }: PuzzleStatsProps) {
  const startLetterCounts = getStartLetterCounts(solutions, letters);
  const len7PlusCount = getLen7PlusCount(solutions);

  return (
    <section className="stats-section">
      <h3 className="stats-title">📊 Estadísticas del puzzle</h3>
      
      <div className="stats-block">
        <h4 className="stats-subtitle">Empiezan por...</h4>
        <div className="stats-chips">
          {letters.map(letter => (
            <div key={letter} className="stats-chip">
              <span className="stats-chip-letter">{letter.toUpperCase()}</span>
              <span className="stats-chip-count">{startLetterCounts[letter.toLowerCase()] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-block">
        <h4 className="stats-subtitle">Palabras de 7 o más</h4>
        <p className="stats-value">{len7PlusCount} palabras</p>
      </div>
    </section>
  );
}
