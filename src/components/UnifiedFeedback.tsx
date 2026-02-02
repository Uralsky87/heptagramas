import { useEffect, useState } from 'react';
import '../styles/unifiedFeedback.css';

export type FeedbackType = 'correct' | 'incorrect' | 'already-found' | 'missing-central' | null;

interface UnifiedFeedbackProps {
  type: FeedbackType;
  onAnimationEnd?: () => void;
}

const FEEDBACK_CONFIG = {
  'correct': {
    text: '¡Correcto!',
    color: '#22c55e',
    duration: 1500,
  },
  'incorrect': {
    text: 'Prueba de nuevo',
    color: '#ef4444',
    duration: 1500,
  },
  'already-found': {
    text: 'Palabra ya encontrada',
    color: '#3b82f6',
    duration: 1500,
  },
  'missing-central': {
    text: 'Falta letra central',
    color: '#f97316',
    duration: 2500,
  },
};

export default function UnifiedFeedback({ type, onAnimationEnd }: UnifiedFeedbackProps) {
  const [currentType, setCurrentType] = useState<FeedbackType>(null);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (type) {
      // Si hay un tipo nuevo, cancelar el anterior y mostrar el nuevo
      setCurrentType(type);
      setAnimationKey(prev => prev + 1); // Forzar reinicio de animación

      const config = FEEDBACK_CONFIG[type];
      const timer = setTimeout(() => {
        setCurrentType(null);
        onAnimationEnd?.();
      }, config.duration);

      return () => clearTimeout(timer);
    }
  }, [type, onAnimationEnd]);

  if (!currentType) {
    // Siempre renderizar el contenedor para reservar espacio
    return <div className="unified-feedback" />;
  }

  const config = FEEDBACK_CONFIG[currentType];

  return (
    <div className="unified-feedback">
      <span 
        key={animationKey}
        className="unified-feedback-text"
        style={{ color: config.color }}
      >
        {config.text}
      </span>
    </div>
  );
}
