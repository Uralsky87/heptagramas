import { 
  getStartLetterCounts, 
  getLen7PlusCount,
  getStartLetterCountsFound,
  getLen7PlusCountFound
} from '../lib/stats';

interface PuzzleStatsProps {
  letters: string[]; // 7 letras del puzzle (center + outer), ya normalizadas
  solutions: string[]; // Lista completa de soluciones válidas
  foundWords: string[]; // Palabras encontradas por el usuario
}

export default function PuzzleStats({ letters, solutions, foundWords }: PuzzleStatsProps) {
  const solutionsSet = new Set(solutions);
  
  const startLetterCountsTotal = getStartLetterCounts(solutions, letters);
  const startLetterCountsFound = getStartLetterCountsFound(foundWords, solutionsSet, letters);
  
  const len7PlusTotal = getLen7PlusCount(solutions);
  const len7PlusFound = getLen7PlusCountFound(foundWords, solutionsSet);

  return (
    <section className="stats-section">
      <h3 className="stats-title">📊 Estadísticas del puzzle</h3>
      
      <div className="stats-block">
        <h4 className="stats-subtitle">Empiezan por...</h4>
        <div className="stats-chips">
          {letters.map(letter => {
            const letterLower = letter.toLowerCase();
            const found = startLetterCountsFound[letterLower] || 0;
            const total = startLetterCountsTotal[letterLower] || 0;
            
            return (
              <div key={letter} className="stats-chip">
                <span className="stats-chip-letter">{letter.toUpperCase()}</span>
                <span className="stats-chip-count">{found}/{total}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stats-block">
        <h4 className="stats-subtitle">Palabras de 7 o más</h4>
        <p className="stats-value">7+: {len7PlusFound}/{len7PlusTotal}</p>
      </div>
    </section>
  );
}
