import { useEffect, useRef, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!type) {
      if (!currentType) {
        return;
      }
      clearTimers();
      setIsVisible(false);
      clearTimerRef.current = setTimeout(() => {
        setCurrentType(null);
        onAnimationEnd?.();
      }, 180);
      return () => clearTimers();
    }

    clearTimers();
    setCurrentType(type);
    setIsVisible(true);

    const config = FEEDBACK_CONFIG[type];
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      clearTimerRef.current = setTimeout(() => {
        setCurrentType(null);
        onAnimationEnd?.();
      }, 180);
    }, config.duration);

    return () => clearTimers();
  }, [type, onAnimationEnd]);

  if (!currentType) {
    // Siempre renderizar el contenedor para reservar espacio
    return <div className="unified-feedback" />;
  }

  const config = FEEDBACK_CONFIG[currentType];

  return (
    <div className="unified-feedback">
      <span 
        className={`unified-feedback-text${isVisible ? ' visible' : ''}`}
        style={{ color: config.color }}
      >
        {config.text}
      </span>
    </div>
  );
}
