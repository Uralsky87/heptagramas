import { useEffect, useState } from 'react';
import '../styles/missingCentralFeedback.css';
import { useLanguage } from '../contexts/LanguageContext';

interface MissingCentralFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function MissingCentralFeedback({ isVisible, onAnimationEnd }: MissingCentralFeedbackProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useLanguage();

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
      <span className="missing-central-text">{t('feedback.missing_central')}</span>
    </div>
  );
}
