import type { Puzzle } from '../types';

export const MOTHERS_DAY_PROGRESS_ID = 'special-mothers-day-2026';
export const MOTHERS_DAY_PERSONAL_DEFINITION = 'Madre más guapa del mundo.';

export type EventPuzzleTheme = 'default' | 'mothers-day';

export interface EventPuzzle {
  id: string;
  title: string;
  description: string;
  activeFrom: string;
  activeTo: string;
  puzzle: Puzzle;
  theme: EventPuzzleTheme;
  extraSolutions?: string[];
  allowMissingCenterWords?: string[];
  highlightedWords?: string[];
  customDefinitions?: Record<string, string>;
}

export const MOTHERS_DAY_PUZZLE: Puzzle = {
  id: MOTHERS_DAY_PROGRESS_ID,
  title: 'Especial día de la madre',
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

export const EVENT_PUZZLES: EventPuzzle[] = [
  {
    id: MOTHERS_DAY_PROGRESS_ID,
    title: 'Especial día de la madre',
    description: 'Un heptagrama preparado para celebrar este día.',
    activeFrom: '2026-05-01',
    activeTo: '2026-05-31',
    puzzle: MOTHERS_DAY_PUZZLE,
    theme: 'mothers-day',
    extraSolutions: MOTHERS_DAY_EXTRA_SOLUTIONS,
    allowMissingCenterWords: MOTHERS_DAY_ALLOW_MISSING_CENTER,
    highlightedWords: MOTHERS_DAY_HIGHLIGHT_WORDS,
    customDefinitions: MOTHERS_DAY_DEFINITIONS,
  },
];

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isEventActive(event: EventPuzzle, dateKey = getLocalDateKey()): boolean {
  return dateKey >= event.activeFrom && dateKey <= event.activeTo;
}

export function getActiveEventPuzzles(dateKey = getLocalDateKey()): EventPuzzle[] {
  return EVENT_PUZZLES.filter((event) => isEventActive(event, dateKey));
}

export function getEventPuzzleById(eventId: string): EventPuzzle | null {
  return EVENT_PUZZLES.find((event) => event.id === eventId) ?? null;
}
