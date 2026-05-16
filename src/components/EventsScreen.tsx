import { useEffect, useState } from 'react';
import type { PuzzleProgress } from '../types';
import { EVENT_PUZZLES, isEventActive, type EventPuzzle } from '../lib/specialPuzzles';
import { loadPuzzleProgress, preloadPuzzleProgress } from '../lib/storageAdapter';
import PageContainer from './layout/PageContainer';
import TopBar from './TopBar';
import BackChevronIcon from './icons/BackChevronIcon';
import { useLanguage } from '../contexts/useLanguage';

interface EventsScreenProps {
  onBack: () => void;
  onSelectEvent: (eventId: string) => void;
}

interface EventWithProgress extends EventPuzzle {
  progress: PuzzleProgress | null;
}

export default function EventsScreen({ onBack, onSelectEvent }: EventsScreenProps) {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventWithProgress[]>([]);

  useEffect(() => {
    let isCancelled = false;

    async function loadEventsProgress() {
      await Promise.all(EVENT_PUZZLES.map((event) => preloadPuzzleProgress(event.id)));
      if (isCancelled) {
        return;
      }

      setEvents(EVENT_PUZZLES.map((event) => ({
        ...event,
        progress: loadPuzzleProgress(event.id),
      })));
    }

    loadEventsProgress().catch((error) => {
      console.error('[EventsScreen] Error cargando progreso de eventos:', error);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <PageContainer>
      <TopBar
        onThemeClick={() => {}}
        onSettingsClick={() => {}}
        title={t('events.title')}
        showThemeButton={false}
        showSettingsButton={false}
        leftButton={
          <button className="top-bar-btn top-bar-btn-left" onClick={onBack} aria-label={t('common.back')} title={t('common.back')}>
            <BackChevronIcon />
          </button>
        }
      />

      <div className="events-content">
        {events.length === 0 ? (
          <p className="events-empty">{t('events.empty')}</p>
        ) : (
          <div className="events-list">
            {events.map((event) => {
              const active = isEventActive(event);
              const foundCount = event.progress?.foundWords.length ?? 0;
              const solutionCount = event.puzzle.solutionCount ?? null;
              const progressPercent = solutionCount
                ? Math.round((foundCount / solutionCount) * 100)
                : 0;

              return (
                <button
                  key={event.id}
                  className={`event-card ${active ? 'event-card-active' : ''}`}
                  onClick={() => onSelectEvent(event.id)}
                >
                  <div className="event-card-header">
                    <div>
                      <h2>{event.title}</h2>
                      <p>{event.description}</p>
                    </div>
                    {active && <span className="event-active-badge">{t('events.active_badge')}</span>}
                  </div>

                  <div className="event-card-preview">
                    <span className="center-letter-big">{event.puzzle.center.toUpperCase()}</span>
                    <span className="outer-letters-big">{event.puzzle.outer.map((letter) => letter.toUpperCase()).join(' ')}</span>
                  </div>

                  {foundCount > 0 && (
                    <div className="event-progress">
                      <div className="progress-bar-big">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span className="progress-text-big">
                        {foundCount} / {solutionCount ?? '?'} {t('daily.words')}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
