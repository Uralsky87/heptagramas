import { useEffect, useMemo, useRef, useState } from 'react';
import type { FeedbackBannerKind, FeedbackSignal } from '../lib/feedback';
import { useLanguage } from '../contexts/useLanguage';
import '../styles/unifiedFeedback.css';

export type FeedbackType =
  | 'correct'
  | 'superhepta'
  | 'incorrect'
  | 'already-found'
  | 'missing-central'
  | null;

interface UnifiedFeedbackProps {
  signal?: FeedbackSignal | null;
  type?: FeedbackType;
  onAnimationEnd?: () => void;
}

const FEEDBACK_CONFIG: Record<FeedbackBannerKind, { duration: number }> = {
  correct: { duration: 1700 },
  superhepta: { duration: 2200 },
  incorrect: { duration: 1650 },
  'already-found': { duration: 1800 },
  'missing-central': { duration: 2300 },
};

export default function UnifiedFeedback({ signal, type, onAnimationEnd }: UnifiedFeedbackProps) {
  const { t } = useLanguage();
  const [currentSignal, setCurrentSignal] = useState<FeedbackSignal | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextLegacyIdRef = useRef(0);

  const legacySignal = useMemo<FeedbackSignal | null>(() => {
    if (!type) {
      return null;
    }

    nextLegacyIdRef.current += 1;

    const text =
      type === 'superhepta'
        ? t('feedback.superhepta')
        : type === 'correct'
          ? t('feedback.correct')
          : type === 'already-found'
            ? t('feedback.already_found')
            : type === 'missing-central'
              ? t('feedback.missing_central')
              : t('feedback.try_again');

    return {
      id: nextLegacyIdRef.current,
      kind: type,
      text,
    };
  }, [t, type]);

  const activeSignal = signal ?? legacySignal;

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

    if (!activeSignal) {
      if (!currentSignal) {
        return () => clearTimers();
      }

      setIsVisible(false);
      clearTimerRef.current = setTimeout(() => {
        setCurrentSignal(null);
        onAnimationEnd?.();
      }, 220);

      return () => clearTimers();
    }

    setIsVisible(false);
    showTimerRef.current = setTimeout(() => {
      setCurrentSignal(activeSignal);
      setIsVisible(true);

      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        clearTimerRef.current = setTimeout(() => {
          setCurrentSignal((active) => (active?.id === activeSignal.id ? null : active));
          onAnimationEnd?.();
        }, 220);
      }, FEEDBACK_CONFIG[activeSignal.kind].duration);
    }, 24);

    return () => clearTimers();
  }, [activeSignal, currentSignal, onAnimationEnd]);

  return (
    <div className="unified-feedback" aria-live="polite" aria-atomic="true">
      <div
        className={`unified-feedback-badge${
          currentSignal ? ` is-${currentSignal.kind}` : ''
        }${isVisible ? ' visible' : ''}`}
      >
        <span className="unified-feedback-glow" aria-hidden="true" />
        <span className="unified-feedback-text">{currentSignal?.text ?? ''}</span>
      </div>
    </div>
  );
}
