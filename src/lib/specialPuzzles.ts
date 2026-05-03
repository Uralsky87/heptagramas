import type { Puzzle } from '../types';

export const MOTHERS_DAY_PROGRESS_ID = 'special-mothers-day-2026';
export const MOTHERS_DAY_PERSONAL_DEFINITION = 'Madre más guapa del mundo.';

export const MOTHERS_DAY_PUZZLE: Puzzle = {
  id: MOTHERS_DAY_PROGRESS_ID,
  title: 'Especial Día de la Madre',
  center: 'a',
  outer: ['e', 'i', 'l', 'p', 'r', 't'],
  mode: 'special',
  minLen: 3,
  allowEnye: true,
  solutionCount: 766,
};

export const MOTHERS_DAY_EXTRA_SOLUTIONS = ['pili'];

export const MOTHERS_DAY_ALLOW_MISSING_CENTER = ['pili'];

export const MOTHERS_DAY_HIGHLIGHT_WORDS = ['pilar', 'pili'];

export const MOTHERS_DAY_DEFINITIONS: Record<string, string> = {
  pilar: MOTHERS_DAY_PERSONAL_DEFINITION,
  pili: MOTHERS_DAY_PERSONAL_DEFINITION,
};
