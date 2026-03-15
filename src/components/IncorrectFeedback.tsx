import { useEffect, useState } from 'react';
import '../styles/incorrectFeedback.css';
import { useLanguage } from '../contexts/LanguageContext';

interface IncorrectFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function IncorrectFeedback({ isVisible, onAnimationEnd }: IncorrectFeedbackProps) {
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
    <div className="incorrect-feedback">
      <span className="incorrect-text">{t('feedback.try_again')}</span>
    </div>
  );
}
