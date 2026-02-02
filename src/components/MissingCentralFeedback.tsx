import { useEffect, useState } from 'react';
import '../styles/missingCentralFeedback.css';

interface MissingCentralFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function MissingCentralFeedback({ isVisible, onAnimationEnd }: MissingCentralFeedbackProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd?.();
      }, 2500); // Duración de la animación

      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationEnd]);

  if (!isAnimating) return null;

  return (
    <div className="missing-central-feedback">
      <span className="missing-central-text">Falta letra central</span>
    </div>
  );
}
