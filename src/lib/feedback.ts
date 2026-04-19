import type { ValidationResult } from '../types';

export type FeedbackTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export type FeedbackBannerKind =
  | 'correct'
  | 'superhepta'
  | 'incorrect'
  | 'already-found'
  | 'missing-central';

export interface FeedbackSignal {
  id: number;
  kind: FeedbackBannerKind;
  text: string;
}

export interface SubmissionFeedbackIntent {
  bannerKind: FeedbackBannerKind;
  detailTone: FeedbackTone;
  bannerText?: string;
  successAnimation?: boolean;
  errorAnimation?: boolean;
  sound?: 'success' | 'superhepta' | 'error' | 'none';
  haptic?: 'success' | 'warning' | 'error' | 'none';
}

type TranslateFn = (key: string) => string;

export function buildValidationFeedbackIntent(
  result: ValidationResult,
  t: TranslateFn
): SubmissionFeedbackIntent {
  switch (result.code) {
    case 'already-found':
      return {
        bannerKind: 'already-found',
        detailTone: 'info',
        errorAnimation: true,
        sound: 'error',
        haptic: 'warning',
        bannerText: t('feedback.already_found'),
      };
    case 'missing-central':
      return {
        bannerKind: 'missing-central',
        detailTone: 'warning',
        errorAnimation: true,
        sound: 'error',
        haptic: 'warning',
        bannerText: t('feedback.missing_central'),
      };
    case 'too-short':
    case 'invalid-letters':
    case 'not-in-puzzle-dict':
    default:
      return {
        bannerKind: 'incorrect',
        detailTone: 'error',
        errorAnimation: true,
        sound: 'error',
        haptic: 'error',
        bannerText: t('feedback.try_again'),
      };
  }
}

export function buildSuccessFeedbackIntent(
  variant: 'correct' | 'superhepta'
): SubmissionFeedbackIntent {
  if (variant === 'superhepta') {
    return {
      bannerKind: 'superhepta',
      detailTone: 'success',
      successAnimation: true,
      sound: 'superhepta',
      haptic: 'success',
    };
  }

  return {
    bannerKind: 'correct',
    detailTone: 'success',
    successAnimation: true,
    sound: 'success',
    haptic: 'success',
  };
}
