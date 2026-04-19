import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../contexts/useLanguage';
import type { FeedbackSignal, FeedbackTone, SubmissionFeedbackIntent } from './feedback';
import { playErrorSound, playSuccessSound, playSuperHeptaSound } from './soundEffects';

const SUCCESS_ANIMATION_MS = 760;
const ERROR_ANIMATION_MS = 520;
const SUBMIT_PULSE_MS = 380;

function runHaptic(kind: SubmissionFeedbackIntent['haptic']) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  switch (kind) {
    case 'success':
      navigator.vibrate([18]);
      break;
    case 'warning':
      navigator.vibrate([14, 18, 14]);
      break;
    case 'error':
      navigator.vibrate([22, 28, 22]);
      break;
    default:
      break;
  }
}

export default function useSubmissionFeedback() {
  const { t } = useLanguage();
  const [banner, setBanner] = useState<FeedbackSignal | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('neutral');
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [errorAnimation, setErrorAnimation] = useState(false);
  const [submitPulseTone, setSubmitPulseTone] = useState<'success' | 'error' | null>(null);
  const nextIdRef = useRef(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    if (submitTimerRef.current) {
      clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const triggerFeedback = (
    intent: SubmissionFeedbackIntent,
    options?: { soundEnabled?: boolean }
  ) => {
    clearTimers();
    nextIdRef.current += 1;

    const bannerText =
      intent.bannerText ??
      (intent.bannerKind === 'superhepta'
        ? t('feedback.superhepta')
        : intent.bannerKind === 'correct'
          ? t('feedback.correct')
          : intent.bannerKind === 'already-found'
            ? t('feedback.already_found')
            : intent.bannerKind === 'missing-central'
              ? t('feedback.missing_central')
              : t('feedback.try_again'));

    setBanner({
      id: nextIdRef.current,
      kind: intent.bannerKind,
      text: bannerText,
    });
    setFeedbackTone(intent.detailTone);

    if (intent.successAnimation) {
      setSuccessAnimation(false);
      setSubmitPulseTone(null);
      requestAnimationFrame(() => {
        setSuccessAnimation(true);
        setSubmitPulseTone('success');
      });
      successTimerRef.current = setTimeout(() => setSuccessAnimation(false), SUCCESS_ANIMATION_MS);
      submitTimerRef.current = setTimeout(() => setSubmitPulseTone(null), SUBMIT_PULSE_MS);
    }

    if (intent.errorAnimation) {
      setErrorAnimation(false);
      setSubmitPulseTone(null);
      requestAnimationFrame(() => {
        setErrorAnimation(true);
        setSubmitPulseTone('error');
      });
      errorTimerRef.current = setTimeout(() => setErrorAnimation(false), ERROR_ANIMATION_MS);
      submitTimerRef.current = setTimeout(() => setSubmitPulseTone(null), SUBMIT_PULSE_MS);
    }

    if (options?.soundEnabled) {
      switch (intent.sound) {
        case 'success':
          playSuccessSound();
          break;
        case 'superhepta':
          playSuperHeptaSound();
          break;
        case 'error':
          playErrorSound();
          break;
        default:
          break;
      }
    }

    runHaptic(intent.haptic);
  };

  const dismissBanner = () => {
    setBanner(null);
  };

  const resetFeedbackTone = () => {
    setFeedbackTone('neutral');
  };

  return {
    banner,
    dismissBanner,
    errorAnimation,
    feedbackTone,
    resetFeedbackTone,
    submitPulseTone,
    successAnimation,
    triggerFeedback,
  };
}
