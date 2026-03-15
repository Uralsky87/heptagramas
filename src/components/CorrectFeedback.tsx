import { useEffect, useState } from 'react';
import '../styles/correctFeedback.css';
import { useLanguage } from '../contexts/LanguageContext';

interface CorrectFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function CorrectFeedback({ isVisible, onAnimationEnd }: CorrectFeedbackProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

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
    <div className="correct-feedback">
      <span className="correct-text">{t('feedback.correct')}</span>
    </div>
  );
}
