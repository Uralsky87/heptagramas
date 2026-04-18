import { useEffect, useRef, useState } from 'react';
import '../styles/unifiedFeedback.css';
import { useLanguage } from '../contexts/useLanguage';

export type FeedbackType = 'correct' | 'incorrect' | 'already-found' | 'missing-central' | null;

interface UnifiedFeedbackProps {
  type: FeedbackType;
  onAnimationEnd?: () => void;
}

const FEEDBACK_CONFIG = {
  'correct': {
    color: 'var(--theme-feedback-success)',
    duration: 1500,
  },
  'incorrect': {
    color: 'var(--theme-feedback-error)',
    duration: 1500,
  },
  'already-found': {
    color: 'var(--theme-feedback-info)',
    duration: 1500,
  },
  'missing-central': {
    color: 'var(--theme-feedback-warning)',
    duration: 2500,
  },
} as const;

export default function UnifiedFeedback({ type, onAnimationEnd }: UnifiedFeedbackProps) {
  const { t } = useLanguage();
  const [currentType, setCurrentType] = useState<FeedbackType>(null);
  const [isVisible, setIsVisible] = useState(false);
  const currentTypeRef = useRef<FeedbackType>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDisplayedType = (nextType: FeedbackType) => {
    currentTypeRef.current = nextType;
    setCurrentType(nextType);
  };

  const clearTimers = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
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
    clearTimers();

    if (!type) {
      if (!currentTypeRef.current) {
        return;
      }

      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        clearTimerRef.current = setTimeout(() => {
          setDisplayedType(null);
          onAnimationEnd?.();
        }, 180);
      }, 0);

      return () => clearTimers();
    }

    currentTypeRef.current = type;
    showTimerRef.current = setTimeout(() => {
      setDisplayedType(type);
      setIsVisible(true);

      const config = FEEDBACK_CONFIG[type];
      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        clearTimerRef.current = setTimeout(() => {
          setDisplayedType(null);
          onAnimationEnd?.();
        }, 180);
      }, config.duration);
    }, 0);

    return () => clearTimers();
  }, [type, onAnimationEnd]);

  if (!currentType) {
    // Siempre renderizar el contenedor para reservar espacio
    return <div className="unified-feedback" />;
  }

  const config = FEEDBACK_CONFIG[currentType];
  const feedbackTextMap = {
    'correct': t('feedback.correct'),
    'incorrect': t('feedback.try_again'),
    'already-found': t('feedback.already_found'),
    'missing-central': t('feedback.missing_central'),
  } as const;

  return (
    <div className="unified-feedback">
      <span 
        className={`unified-feedback-text${isVisible ? ' visible' : ''}`}
        style={{ color: config.color }}
      >
        {feedbackTextMap[currentType]}
      </span>
    </div>
  );
}
