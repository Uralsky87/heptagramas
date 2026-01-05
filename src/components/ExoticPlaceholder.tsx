interface ExoticPlaceholderProps {
  onBack: () => void;
}

export default function ExoticPlaceholder({ onBack }: ExoticPlaceholderProps) {
  return (
    <div className="placeholder-container">
      <button className="btn-back" onClick={onBack}>
        ← Inicio
      </button>
      
      <div className="placeholder-content">
        <div className="placeholder-icon">🔒</div>
        <h2 className="placeholder-title">Puzzles Exóticos</h2>
        <p className="placeholder-text">
          Esta sección estará disponible próximamente con puzzles especiales y desafíos únicos.
        </p>
        <div className="placeholder-features">
          <div className="feature-item">✨ Nuevas reglas especiales</div>
          <div className="feature-item">🎨 Letras temáticas</div>
          <div className="feature-item">🏆 Desafíos cronometrados</div>
        </div>
      </div>
    </div>
  );
}
