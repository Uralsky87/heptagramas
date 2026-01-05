import { useState } from 'react';

interface HeptagramBoardProps {
  center: string;
  outer: string[]; // 6 letras
}

export default function HeptagramBoard({ center, outer }: HeptagramBoardProps) {
  const [outerLetters, setOuterLetters] = useState(outer);

  const shuffleOuter = () => {
    const shuffled = [...outerLetters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setOuterLetters(shuffled);
  };

  return (
    <div className="heptagram-section">
      <div className="hexagon-container">
        {/* Hexágono central */}
        <div className="hex-center">
          <span className="hex-letter">{center.toUpperCase()}</span>
        </div>
        
        {/* 6 trapecios en posiciones 0°, 60°, 120°, 180°, 240°, 300° */}
        {outerLetters.map((letter, index) => (
          <div key={index} className="trap-outer" data-index={index}>
            <span className="trap-letter">{letter.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <button className="btn-shuffle" onClick={shuffleOuter}>
        🔄 Reordenar
      </button>
    </div>
  );
}
