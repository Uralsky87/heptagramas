import { createClassicProgressIfMissing } from '../storage/api';
import { flushPendingWrites, loadPuzzleProgress, preloadPuzzleProgress } from './storageAdapter';
import { getEventProgressId, getEventPuzzleAvailability, getLocalDateKey, type EventPuzzle } from './specialPuzzles';

/** Read disk before deciding whether an event can be opened or started. */
export async function prepareEventEntry(
  event: EventPuzzle,
  { startNew = false, dateKey = getLocalDateKey(), signal }: {
    startNew?: boolean;
    dateKey?: string;
    signal?: AbortSignal;
  } = {},
): Promise<boolean> {
  const progressId = getEventProgressId(event, dateKey);
  await flushPendingWrites();
  signal?.throwIfAborted();
  await preloadPuzzleProgress(progressId, { throwOnError: true });
  signal?.throwIfAborted();

  const progress = loadPuzzleProgress(progressId);
  const availability = getEventPuzzleAvailability(event, progress, dateKey);
  if (!availability.canOpen) return false;

  if (startNew && !progress && availability.canStartNew) {
    const now = Date.now();
    // The read + insert is atomic, including against another tab starting the event.
    await createClassicProgressIfMissing({
      id: progressId,
      foundWords: [],
      score: 0,
      superHeptaWords: [],
      completed: false,
      startedAt: now,
      lastPlayedAt: now,
    });
    signal?.throwIfAborted();
    await preloadPuzzleProgress(progressId, { throwOnError: true });
    signal?.throwIfAborted();
  }

  return true;
}
