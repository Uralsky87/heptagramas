import { useEffect, useState } from 'react';
import '../styles/alreadyFoundFeedback.css';
import { useLanguage } from '../contexts/LanguageContext';

interface AlreadyFoundFeedbackProps {
  isVisible: boolean;
  onAnimationEnd?: () => void;
}

export default function AlreadyFoundFeedback({ isVisible, onAnimationEnd }: AlreadyFoundFeedbackProps) {
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
    <div className="already-found-feedback">
      <span className="already-found-text">{t('feedback.already_found')}</span>
    </div>
  );
}
