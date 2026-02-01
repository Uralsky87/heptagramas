import { useEffect, useState } from 'react';
import '../styles/incorrectFeedback.css';

interface IncorrectFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function IncorrectFeedback({ isVisible, onAnimationEnd }: IncorrectFeedbackProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd?.();
      }, 1500); // Duración de la animación

      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationEnd]);

  if (!isAnimating) return null;

  return (
    <div className="incorrect-feedback">
      <span className="incorrect-text">Prueba de nuevo</span>
    </div>
  );
}
