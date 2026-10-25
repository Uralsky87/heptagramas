import type { Puzzle, PuzzleProgress } from '../types';

export const MOTHERS_DAY_PROGRESS_ID = 'special-mothers-day-2026';
export const CHRISTMAS_EVENT_ID = 'special-christmas';
export const SUMMER_EVENT_ID = 'special-summer';
export const HALLOWEEN_EVENT_ID = 'special-halloween';
export const MOTHERS_DAY_PERSONAL_DEFINITION = 'Madre más guapa del mundo.';

export type EventPuzzleTheme = 'default' | 'mothers-day' | 'christmas' | 'summer' | 'halloween';

export interface FixedEventSchedule {
  kind: 'fixed';
  activeFrom: string;
  activeTo: string;
}

export interface AnnualEventSchedule {
  kind: 'annual';
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export type EventPuzzleSchedule = FixedEventSchedule | AnnualEventSchedule;

export interface EventPuzzle {
  id: string;
  title: string;
  description: string;
  schedule: EventPuzzleSchedule;
  puzzle: Puzzle;
  theme: EventPuzzleTheme;
  // Keep legacy route IDs while using stable prefixes for annual saves.
  progressIdPrefix?: string;
  extraSolutions?: string[];
  allowMissingCenterWords?: string[];
  highlightedWords?: string[];
  customDefinitions?: Record<string, string>;
  unlockAtWordCount?: number;
  unlockedExtraLetter?: string;
  unlockedSolutionCount?: number;
  unlockedExtraSolutions?: string[];
  unlockedAllowMissingCenterWords?: string[];
  unlockedHighlightedWords?: string[];
}

export interface EventPuzzleAvailability {
  active: boolean;
  hasStarted: boolean;
  visibleOnHome: boolean;
  visibleInEvents: boolean;
  canStartNew: boolean;
  canContinue: boolean;
  canOpen: boolean;
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

export const CHRISTMAS_PUZZLE: Puzzle = {
  id: CHRISTMAS_EVENT_ID,
  title: 'Especial Navidad',
  center: 'e',
  outer: ['a', 'b', 'l', 'n', 'o', 's'],
  mode: 'special',
  minLen: 3,
  allowEnye: true,
  solutionCount: 209,
};

export const CHRISTMAS_EXTRA_SOLUTIONS = ['belen', 'belenes', 'noel', 'bola', 'bolas', 'salon'];

export const CHRISTMAS_ALLOW_MISSING_CENTER = ['bola', 'bolas', 'salon'];

export const CHRISTMAS_HIGHLIGHT_WORDS = ['belen', 'belenes', 'noel', 'bola', 'bolas', 'salon'];

export const CHRISTMAS_UNLOCKED_EXTRA_SOLUTIONS = ['reno', 'renos', 'arbol', 'arboles'];

export const CHRISTMAS_UNLOCKED_ALLOW_MISSING_CENTER = ['arbol'];

export const CHRISTMAS_UNLOCKED_HIGHLIGHT_WORDS = ['reno', 'renos', 'arbol', 'arboles'];

export const CHRISTMAS_DEFINITIONS: Record<string, string> = {
  arbol: 'Árbol decorado con luces, bolas y adornos durante la Navidad.',
  arboles: 'Árboles decorados con luces y adornos para celebrar la Navidad.',
  belen: 'Representación navideña del nacimiento de Jesús.',
  belenes: 'Conjuntos de figuras y escenas que representan el nacimiento de Jesús en Navidad.',
  bola: 'Adorno redondo que se cuelga en el árbol de Navidad.',
  bolas: 'Bolas navideñas para decorar el árbol con color y brillo.',
  noel: 'Nombre asociado a la Navidad y a sus celebraciones.',
  reno: 'Animal navideño que tira del trineo en las historias de Papá Noel.',
  renos: 'Animales navideños que tiran del trineo en las historias de Papá Noel.',
  salon: 'Lugar de reunión con la familia para celebrar la Navidad.',
};

export const SUMMER_PUZZLE: Puzzle = {
  id: SUMMER_EVENT_ID,
  title: 'El verano ya está aquí',
  center: 'a',
  outer: ['e', 'l', 'n', 'o', 'r', 'v'],
  mode: 'special',
  minLen: 3,
  allowEnye: true,
  solutionCount: 389,
};

export const SUMMER_EXTRA_SOLUTIONS = ['verano', 'veranear', 'veraneo', 'ola', 'arena', 'velero'];

export const SUMMER_ALLOW_MISSING_CENTER = ['velero'];

export const SUMMER_HIGHLIGHT_WORDS = ['verano', 'veranear', 'veraneo', 'ola', 'arena', 'velero'];

export const SUMMER_UNLOCKED_EXTRA_SOLUTIONS = ['sol', 'olas'];

export const SUMMER_UNLOCKED_ALLOW_MISSING_CENTER = ['sol'];

export const SUMMER_UNLOCKED_HIGHLIGHT_WORDS = ['sol', 'olas'];

export const SUMMER_DEFINITIONS: Record<string, string> = {
  arena: 'Tierra fina de la playa, perfecta para apoyar la toalla o construir castillos.',
  ola: 'Movimiento del mar que llega a la orilla.',
  olas: 'Movimientos del mar que anuncian baño, espuma y costa.',
  sol: 'Astro que ilumina y calienta los días largos de verano.',
  velero: 'Embarcación que avanza impulsada por el viento.',
  verano: 'Estación más cálida del año, asociada al sol, las vacaciones y la playa.',
  veranear: 'Pasar el verano o parte de él en un lugar de descanso.',
  veraneo: 'Temporada o estancia dedicada a pasar el verano fuera de casa.',
};

export const HALLOWEEN_PUZZLE: Puzzle = {
  id: HALLOWEEN_EVENT_ID,
  title: 'Una noche de palabras',
  center: 'a',
  outer: ['b', 'c', 'l', 'o', 's', 'z'],
  mode: 'special',
  minLen: 3,
  allowEnye: true,
  solutionCount: 280,
};

export const EVENT_PUZZLES: EventPuzzle[] = [
  {
    id: HALLOWEEN_EVENT_ID,
    title: 'Una noche de palabras',
    description: 'Calabazas encendidas, escobas y un poco de magia en cada letra.',
    schedule: { kind: 'annual', startMonth: 10, startDay: 31, endMonth: 11, endDay: 30 },
    puzzle: HALLOWEEN_PUZZLE,
    theme: 'halloween',
    highlightedWords: ['calabaza', 'calabozo'],
    customDefinitions: {
      calabaza: 'Fruto de otoño que, tallado e iluminado, se convierte en la linterna más reconocible de Halloween.',
      calabozo: 'Celda oscura y apartada, habitual en castillos y relatos de misterio.',
      escoba: 'Utensilio para barrer y vehículo de las brujas en los cuentos y las leyendas.',
    },
    unlockAtWordCount: 50,
    unlockedExtraLetter: 'e',
    unlockedSolutionCount: 482,
    unlockedHighlightedWords: ['escoba'],
  },
  {
    id: MOTHERS_DAY_PROGRESS_ID,
    title: 'Especial día de la madre',
    description: 'Un heptagrama preparado para celebrar este día.',
    schedule: {
      kind: 'annual',
      startMonth: 5,
      startDay: 1,
      endMonth: 5,
      endDay: 31,
    },
    puzzle: MOTHERS_DAY_PUZZLE,
    theme: 'mothers-day',
    progressIdPrefix: 'special-mothers-day',
    extraSolutions: MOTHERS_DAY_EXTRA_SOLUTIONS,
    allowMissingCenterWords: MOTHERS_DAY_ALLOW_MISSING_CENTER,
    highlightedWords: MOTHERS_DAY_HIGHLIGHT_WORDS,
    customDefinitions: MOTHERS_DAY_DEFINITIONS,
  },
  {
    id: CHRISTMAS_EVENT_ID,
    title: 'Especial Navidad',
    description: 'Un heptagrama navideño para jugar en familia.',
    schedule: {
      kind: 'annual',
      startMonth: 12,
      startDay: 15,
      endMonth: 1,
      endDay: 15,
    },
    puzzle: CHRISTMAS_PUZZLE,
    theme: 'christmas',
    extraSolutions: CHRISTMAS_EXTRA_SOLUTIONS,
    allowMissingCenterWords: CHRISTMAS_ALLOW_MISSING_CENTER,
    highlightedWords: CHRISTMAS_HIGHLIGHT_WORDS,
    customDefinitions: CHRISTMAS_DEFINITIONS,
    unlockAtWordCount: 50,
    unlockedExtraLetter: 'r',
    unlockedSolutionCount: 798,
    unlockedExtraSolutions: CHRISTMAS_UNLOCKED_EXTRA_SOLUTIONS,
    unlockedAllowMissingCenterWords: CHRISTMAS_UNLOCKED_ALLOW_MISSING_CENTER,
    unlockedHighlightedWords: CHRISTMAS_UNLOCKED_HIGHLIGHT_WORDS,
  },
  {
    id: SUMMER_EVENT_ID,
    title: 'El verano ya está aquí',
    description: 'Un heptagrama soleado para celebrar los días largos.',
    schedule: {
      kind: 'annual',
      startMonth: 6,
      startDay: 21,
      endMonth: 7,
      endDay: 21,
    },
    puzzle: SUMMER_PUZZLE,
    theme: 'summer',
    extraSolutions: SUMMER_EXTRA_SOLUTIONS,
    allowMissingCenterWords: SUMMER_ALLOW_MISSING_CENTER,
    highlightedWords: SUMMER_HIGHLIGHT_WORDS,
    customDefinitions: SUMMER_DEFINITIONS,
    unlockAtWordCount: 75,
    unlockedExtraLetter: 's',
    unlockedSolutionCount: 743,
    unlockedExtraSolutions: SUMMER_UNLOCKED_EXTRA_SOLUTIONS,
    unlockedAllowMissingCenterWords: SUMMER_UNLOCKED_ALLOW_MISSING_CENTER,
    unlockedHighlightedWords: SUMMER_UNLOCKED_HIGHLIGHT_WORDS,
  },
];

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthDayKey(month: number, day: number): string {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isAnnualScheduleActive(schedule: AnnualEventSchedule, dateKey: string): boolean {
  const monthDay = dateKey.slice(5);
  const startsAt = getMonthDayKey(schedule.startMonth, schedule.startDay);
  const endsAt = getMonthDayKey(schedule.endMonth, schedule.endDay);

  if (startsAt <= endsAt) {
    return monthDay >= startsAt && monthDay <= endsAt;
  }

  return monthDay >= startsAt || monthDay <= endsAt;
}

function getAnnualScheduleSeasonStartYear(schedule: AnnualEventSchedule, dateKey: string): number {
  const year = Number(dateKey.slice(0, 4));
  const monthDay = dateKey.slice(5);
  const startsAt = getMonthDayKey(schedule.startMonth, schedule.startDay);
  const endsAt = getMonthDayKey(schedule.endMonth, schedule.endDay);

  if (startsAt <= endsAt) {
    return monthDay < startsAt ? year - 1 : year;
  }

  return monthDay >= startsAt ? year : year - 1;
}

export function isEventActive(event: EventPuzzle, dateKey = getLocalDateKey()): boolean {
  if (event.schedule.kind === 'fixed') {
    return dateKey >= event.schedule.activeFrom && dateKey <= event.schedule.activeTo;
  }

  return isAnnualScheduleActive(event.schedule, dateKey);
}

export function getEventProgressId(event: EventPuzzle, dateKey = getLocalDateKey()): string {
  if (event.schedule.kind === 'fixed') {
    return event.id;
  }

  return `${event.progressIdPrefix ?? event.id}-${getAnnualScheduleSeasonStartYear(event.schedule, dateKey)}`;
}

export function getActiveEventPuzzles(dateKey = getLocalDateKey()): EventPuzzle[] {
  return EVENT_PUZZLES.filter((event) => isEventActive(event, dateKey));
}

export function getEventPuzzleById(eventId: string): EventPuzzle | null {
  return EVENT_PUZZLES.find((event) => event.id === eventId) ?? null;
}

export function hasEventProgress(progress: PuzzleProgress | null | undefined): boolean {
  return Boolean(progress?.startedAt || progress?.lastPlayedAt || progress?.foundWords.length);
}

export function getEventSolutionCount(event: EventPuzzle, progress?: PuzzleProgress | null): number | null {
  if (progress?.exoticLetter && event.unlockedSolutionCount) {
    return event.unlockedSolutionCount;
  }

  return event.puzzle.solutionCount ?? null;
}

export function getEventPuzzleAvailability(
  event: EventPuzzle,
  progress?: PuzzleProgress | null,
  dateKey = getLocalDateKey(),
): EventPuzzleAvailability {
  const active = isEventActive(event, dateKey);
  const hasStarted = hasEventProgress(progress);

  return {
    active,
    hasStarted,
    visibleOnHome: active,
    visibleInEvents: active || hasStarted,
    canStartNew: active,
    canContinue: hasStarted,
    canOpen: active || hasStarted,
  };
}
