import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Spinner } from '@maxhub/max-ui';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

import { PageTemplate } from '@shared/ui/page-template';
import { MuSearchInput } from '@shared/ui/input';
import { ErrorState } from '@shared/ui/error-state';
import { CalendarIcon, FavoriteBooksIcon } from '@shared/icons';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { cn } from '@shared/utils/className';
import { eventsApiService, maxBridgeService } from '@api/services';
import { ApiError } from '@api/shared/api/api-client';

import type { EventSortOrder, UniversityEvent } from '@entities/event';
import {
  formatEventDay,
  formatEventDateTime,
  formatEventPeriod,
  formatParticipantsStatus,
  isEventInPast,
  mapUniversityEventDto,
  mapUniversityEventList,
  sortEventsByStartDate,
} from '@entities/event';
import { EventCard } from '@entities/event/ui/EventCard/EventCard';
import type { EventCardProps } from '@entities/event/ui/EventCard/EventCard';
import { useSwipe } from '@entities/book/ui/BookCard/hooks/useSwipe';

import styles from './EventsScreen.module.scss';

type CalendarDay = {
  key: string;
  date: Date;
  dayNumber: string;
  weekdayShort: string;
  dayLabel: string;
  hasEvents: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

const CALENDAR_TOTAL_DAYS = 7;
const CALENDAR_START_OFFSET = -1;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

const calendarMonthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long' });
const calendarMonthYearFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
});

const calendarWeekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
});

export function EventsScreen() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const eventsAbortControllerRef = useRef<AbortController | null>(null);

  const [todayKey, setTodayKey] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return createDateKey(getToday());
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const dayParam = searchParams.get('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder] = useState<EventSortOrder>('asc');
  const selectedDayKey = useMemo<string | null>(() => dayParam ?? todayKey, [dayParam, todayKey]);

  const [events, setEvents] = useState<ReadonlyArray<UniversityEvent> | null>(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [pendingRegistrationIds, setPendingRegistrationIds] = useState<ReadonlyArray<string>>([]);
  const [isRegisteredSheetOpen, setIsRegisteredSheetOpen] = useState(false);

  const daysScrollerRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setDayRef = useCallback((key: string, element: HTMLButtonElement | null) => {
    const storage = dayRefs.current;

    if (!element) {
      storage.delete(key);
        return;
      }

    storage.set(key, element);
  }, []);

  const loadEvents = useCallback(async () => {
    eventsAbortControllerRef.current?.abort();

    const controller = new AbortController();
    eventsAbortControllerRef.current = controller;

    setIsEventsLoading(true);
    setEventsError(null);

    try {
      const result = await eventsApiService.getEvents({
        signal: controller.signal,
      });

      const mapped = mapUniversityEventList(result);
      setEvents(mapped);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[events] failed to load events', error);
      setEventsError('Не удалось загрузить события');
    } finally {
      if (eventsAbortControllerRef.current === controller) {
        eventsAbortControllerRef.current = null;
      }
      setIsEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const nextTodayKey = createDateKey(getToday());
    setTodayKey(nextTodayKey);
  }, []);

  useEffect(() => {
    return () => {
      eventsAbortControllerRef.current?.abort();
    };
  }, []);

  const pendingRegistrationIdsSet = useMemo(
    () => new Set(pendingRegistrationIds),
    [pendingRegistrationIds],
  );

  const registeredEvents = useMemo(
    () => (events ?? []).filter((event) => event.isRegistered),
    [events],
  );

  const upcomingRegisteredEvents = useMemo(
    () => sortEventsByStartDate(registeredEvents.filter((event) => !isEventInPast(event)), 'asc'),
    [registeredEvents],
  );

  const pastRegisteredEvents = useMemo(
    () => sortEventsByStartDate(registeredEvents.filter((event) => isEventInPast(event)), 'desc'),
    [registeredEvents],
  );

  const normalizedSearchValue = useMemo(() => normalizeSearchQuery(searchQuery), [searchQuery]);

  const searchTokens = useMemo<ReadonlyArray<string>>(() => {
    if (normalizedSearchValue.length === 0) {
      return [];
    }

    return normalizedSearchValue.split(/\s+/).filter(Boolean);
  }, [normalizedSearchValue]);

  const eventsBySearch = useMemo(() => {
    if (events === null) {
      return [];
    }

    if (searchTokens.length === 0) {
      return events;
    }

    return events.filter((event) => doesEventMatchSearch(event, searchTokens));
  }, [events, searchTokens]);

  const isSearchActive = searchTokens.length > 0;

  const filteredEvents = useMemo(
    () =>
      eventsBySearch.filter((event) => (isSearchActive ? true : !isEventInPast(event))),
    [eventsBySearch, isSearchActive],
  );

  const sortedEvents = useMemo(
    () => sortEventsByStartDate(filteredEvents, sortOrder),
    [filteredEvents, sortOrder],
  );

  const { eventsByDate, unscheduledEvents } = useMemo(
    () => partitionEventsByDate(sortedEvents),
    [sortedEvents],
  );

  const searchResultsEvents = useMemo(
    () => (isSearchActive ? sortedEvents : []),
    [isSearchActive, sortedEvents],
  );

  const calendarDays = useMemo(
    () => createCalendarDays(eventsByDate, CALENDAR_TOTAL_DAYS, CALENDAR_START_OFFSET),
    [eventsByDate],
  );

  const formatCalendarSpanLabel = useCallback((daysSubset: ReadonlyArray<CalendarDay>) => {
    if (daysSubset.length === 0) {
      return '';
    }

    const sorted = [...daysSubset].sort(
      (first, second) => first.date.getTime() - second.date.getTime(),
    );
    const firstEntry = sorted[0];
    const lastEntry = sorted[sorted.length - 1];

    if (!firstEntry || !lastEntry) {
      return '';
    }

    const formatMonth = (date: Date) => capitalizeFirstLetter(calendarMonthFormatter.format(date));
    const formatMonthYear = (date: Date) =>
      capitalizeFirstLetter(calendarMonthYearFormatter.format(date));

    const firstMonthName = formatMonth(firstEntry.date);
    const lastMonthName = formatMonth(lastEntry.date);
    const firstYear = firstEntry.date.getFullYear();
    const lastYear = lastEntry.date.getFullYear();

    if (firstEntry.date.getFullYear() === lastEntry.date.getFullYear() &&
        firstEntry.date.getMonth() === lastEntry.date.getMonth()) {
      return formatMonthYear(firstEntry.date);
    }

    if (firstYear === lastYear) {
      return `${firstMonthName} - ${lastMonthName} ${lastYear}`;
    }

    return `${formatMonthYear(firstEntry.date)} - ${formatMonthYear(lastEntry.date)}`;
  }, []);

  const [visibleMonthLabel, setVisibleMonthLabel] = useState(() =>
    formatCalendarSpanLabel(calendarDays),
  );

  const updateDayParam = useCallback(
    (dayKey: string, options?: { replace?: boolean }) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('day', dayKey);
      setSearchParams(nextParams, options);
    },
    [searchParams, setSearchParams],
  );

  const findAdjacentDayKey = useCallback(
    (currentKey: string, direction: 1 | -1) => {
      const adjacent = getAdjacentDay(currentKey, direction, calendarDays, eventsByDate);
      return adjacent?.key ?? null;
    },
    [calendarDays, eventsByDate],
  );

  const handleSwipeNextDay = useCallback(() => {
    if (!selectedDayKey) {
      return;
    }

    const nextKey = findAdjacentDayKey(selectedDayKey, 1);

    if (nextKey) {
      updateDayParam(nextKey);
    }
  }, [findAdjacentDayKey, selectedDayKey, updateDayParam]);

  const handleSwipePrevDay = useCallback(() => {
    if (!selectedDayKey) {
      return;
    }

    const prevKey = findAdjacentDayKey(selectedDayKey, -1);

    if (prevKey) {
      updateDayParam(prevKey);
    }
  }, [findAdjacentDayKey, selectedDayKey, updateDayParam]);

  const canSwipeNext = useMemo(
    () => (selectedDayKey ? findAdjacentDayKey(selectedDayKey, 1) !== null : false),
    [findAdjacentDayKey, selectedDayKey],
  );

  const canSwipePrev = useMemo(
    () => (selectedDayKey ? findAdjacentDayKey(selectedDayKey, -1) !== null : false),
    [findAdjacentDayKey, selectedDayKey],
  );

  useEffect(() => {
    if (!dayParam && todayKey) {
      updateDayParam(todayKey, { replace: true });
    }
  }, [dayParam, todayKey, updateDayParam]);

  useEffect(() => {
    if (calendarDays.length === 0 || selectedDayKey === null) {
      return;
    }

    const selectedExists = calendarDays.some((day) => day.key === selectedDayKey);

    if (selectedExists) {
      return;
    }

    const firstAvailable = calendarDays.find((day) => day.hasEvents);

    if (firstAvailable) {
      updateDayParam(firstAvailable.key, { replace: true });
      return;
    }

    updateDayParam(calendarDays[0].key, { replace: true });
  }, [calendarDays, selectedDayKey, updateDayParam]);

  useEffect(() => {
    const scroller = daysScrollerRef.current;

    if (!scroller) {
        return;
      }

    const selectedIndex = calendarDays.findIndex((day) => day.key === selectedDayKey);

    if (selectedIndex === -1) {
        return;
      }

    let targetScrollLeft = 0;

    if (selectedIndex > 0) {
      const previousKey = calendarDays[selectedIndex - 1]?.key;
      const previousElement =
        previousKey !== undefined ? dayRefs.current.get(previousKey) : undefined;

      if (previousElement) {
        targetScrollLeft = previousElement.offsetLeft;
      }
    }

    scroller.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth',
    });
  }, [calendarDays, selectedDayKey]);

  const selectedDayEvents = useMemo(
    () => (selectedDayKey ? eventsByDate.get(selectedDayKey) ?? [] : []),
    [eventsByDate, selectedDayKey],
  );

  useEffect(() => {
    const updateVisibleMonths = () => {
      const scroller = daysScrollerRef.current;

      if (!scroller) {
        setVisibleMonthLabel(formatCalendarSpanLabel(calendarDays));
        return;
      }

      const scrollerRect = scroller.getBoundingClientRect();
      const visibleDays = calendarDays.filter((day) => {
        const element = dayRefs.current.get(day.key);
        if (!element) {
          return false;
        }

        const rect = element.getBoundingClientRect();
        const intersectionWidth =
          Math.min(rect.right, scrollerRect.right) - Math.max(rect.left, scrollerRect.left);

        return intersectionWidth > 0.5;
      });

      const label = formatCalendarSpanLabel(visibleDays.length > 0 ? visibleDays : calendarDays);
      setVisibleMonthLabel((previous) => (previous === label ? previous : label));
    };

    const rafId = window.requestAnimationFrame(updateVisibleMonths);
    const scroller = daysScrollerRef.current;

    scroller?.addEventListener('scroll', updateVisibleMonths, { passive: true });
    window.addEventListener('resize', updateVisibleMonths);

    return () => {
      window.cancelAnimationFrame(rafId);
      scroller?.removeEventListener('scroll', updateVisibleMonths);
      window.removeEventListener('resize', updateVisibleMonths);
    };
  }, [calendarDays, formatCalendarSpanLabel, searchQuery]);

  useEffect(() => {
    const label = formatCalendarSpanLabel(calendarDays);
    setVisibleMonthLabel(label);
  }, [calendarDays, formatCalendarSpanLabel]);

  const handleDaySelect = useCallback(
    (day: CalendarDay) => {
      if (!day.hasEvents) {
        toast.info('Пока нет событий в этот день');
        return;
      }

      updateDayParam(day.key);
    },
    [updateDayParam],
  );

  const hasActiveFilters = searchTokens.length > 0;
  const hasEventsList = events !== null && (filteredEvents.length > 0 || unscheduledEvents.length > 0);
  const hasSearchResults = isSearchActive && searchResultsEvents.length > 0;
  const isEmptyState = !isEventsLoading && !eventsError && events !== null && !hasEventsList && !hasSearchResults;
  const shouldShowEventsError = Boolean(eventsError) && !isEventsLoading;

  const handleRetryEvents = useCallback(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleRegister = useCallback(
    async (event: UniversityEvent) => {
      const numericId = Number.parseInt(event.id, 10);

      if (Number.isNaN(numericId)) {
        toast.error('Не удалось определить событие для записи');
        return;
      }

      setPendingRegistrationIds((previous) =>
        previous.includes(event.id) ? previous : [...previous, event.id],
      );

      try {
        const response = await eventsApiService.registerForEvent(numericId);
        const updatedEvent = mapUniversityEventDto(response);

        setEvents((previousEvents) => {
          if (previousEvents === null) {
            return [updatedEvent];
          }

          const exists = previousEvents.some((item) => item.id === event.id);

          if (!exists) {
            return [...previousEvents, updatedEvent];
          }

          return previousEvents.map((item) => (item.id === event.id ? updatedEvent : item));
        });

        if (maxBridgeService.isAvailable()) {
          maxBridgeService.haptic.notification('success');
        }

        const periodLabel = formatEventPeriod(
          updatedEvent.startDateTime,
          updatedEvent.endDateTime,
        );
        const successDescription =
          periodLabel.length > 0
            ? `${updatedEvent.title} — ${periodLabel}`
            : formatEventDateTime(updatedEvent.startDateTime);

        toast.success('Вы записались на событие', {
          description: successDescription,
        });
      } catch (error) {
        console.error('[events] failed to register for event', error);

        let message = 'Не удалось записаться на событие';

        if (error instanceof ApiError) {
          if (error.status === 400) {
            message = 'Лимит участников достигнут или вы уже записаны на событие.';
          } else if (error.status === 404) {
            message = 'Событие не найдено. Обновите список и попробуйте снова.';
          }
        }

        toast.error(message);
      } finally {
        setPendingRegistrationIds((previous) => previous.filter((id) => id !== event.id));
      }
    },
    [],
  );

  const handleUnregister = useCallback(
    async (event: UniversityEvent) => {
      const numericId = Number.parseInt(event.id, 10);

      if (Number.isNaN(numericId)) {
        toast.error('Не удалось определить событие для отмены записи');
        return;
      }

      setPendingRegistrationIds((previous) =>
        previous.includes(event.id) ? previous : [...previous, event.id],
      );

      try {
        const response = await eventsApiService.unregisterFromEvent(numericId);
        const updatedEvent = mapUniversityEventDto(response);

        setEvents((previousEvents) => {
          if (previousEvents === null) {
            return [updatedEvent];
          }

          const exists = previousEvents.some((item) => item.id === event.id);

          if (!exists) {
            return [...previousEvents, updatedEvent];
          }

          return previousEvents.map((item) => (item.id === event.id ? updatedEvent : item));
        });

        if (maxBridgeService.isAvailable()) {
          maxBridgeService.haptic.notification('success');
        }

        toast.success('Вы отменили запись на событие', {
          description: event.title,
        });
      } catch (error) {
        console.error('[events] failed to unregister from event', error);

        let message = 'Не удалось отменить запись на событие';

        if (error instanceof ApiError) {
          if (error.status === 400) {
            message = 'Вы не записаны на это событие.';
          } else if (error.status === 404) {
            message = 'Событие не найдено. Обновите список и попробуйте снова.';
          }
        }

        toast.error(message);
      } finally {
        setPendingRegistrationIds((previous) => previous.filter((id) => id !== event.id));
      }
    },
    [],
  );

  const registeredEventsCount = registeredEvents.length;

  const handleOpenRegisteredSheet = useCallback(() => {
    setIsRegisteredSheetOpen(true);
  }, []);

  const handleCloseRegisteredSheet = useCallback(() => {
    setIsRegisteredSheetOpen(false);
  }, []);

  return (
    <>
      <PageTemplate
        title={['События', 'университета']}
        actions={
          <>
            <IconButton
              type="button"
              size="medium"
              mode="secondary"
              appearance="neutral"
              aria-label={
                registeredEventsCount > 0
                  ? `События, на которые вы записаны: ${registeredEventsCount}`
                  : 'События, на которые вы записаны'
              }
              title={
                registeredEventsCount > 0
                  ? `Записаны на ${registeredEventsCount} ${getEventsWord(registeredEventsCount)}`
                  : 'Нет активных записей'
              }
              className={cn(
                styles.actionButton,
                registeredEventsCount > 0 && styles.actionButtonActive,
              )}
              onClick={handleOpenRegisteredSheet}
            >
              <FavoriteBooksIcon className={styles.actionIcon} />
            </IconButton>
          </>
        }
        contentClassName={styles.content}
      >
        {shouldShowEventsError ? (
          <ErrorState
            title="Не удалось загрузить события"
            message="Попробуйте позже, мы уже разбираемся с проблемой."
            onRetry={handleRetryEvents}
          />
        ) : (
          <>
            <MuSearchInput
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск по названию"
              autoComplete="off"
              aria-label="Поиск по событиям"
              aria-busy={isEventsLoading}
              className={styles.searchInput}
            />

            {isEventsLoading ? (
              <div className={styles.loader} role="status" aria-live="polite">
                <Spinner size={30} className={styles.loaderSpinner} />
              </div>
            ) : null}

            {isSearchActive ? (
              <>
                <div className={styles.searchResultsHeader}>
                  <span className={styles.searchResultsTitle}>
                    Найдено событий: {searchResultsEvents.length}
                  </span>
                </div>
                {searchResultsEvents.length > 0 ? (
                  <ul className={styles.searchResultsList}>
                    {searchResultsEvents.map((event) => (
                      <li key={event.id}>
                        <EventCard
                          event={event}
                          isRegistering={pendingRegistrationIdsSet.has(event.id)}
                          onRegister={handleRegister}
                          onUnregister={handleUnregister}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <>
                <section className={styles.calendar}>
                  <div className={styles.calendarHeader}>
                    <span className={styles.calendarMonthPrimary}>{visibleMonthLabel}</span>
                  </div>
                  <div className={styles.calendarDaysScroller}>
                    <div
                      ref={daysScrollerRef}
                      className={styles.calendarDaysScrollerInner}
                      role="tablist"
                      aria-label="Выбор дня недели"
                    >
                      {calendarDays.map((day) => {
                        const isSelected = selectedDayKey !== null && day.key === selectedDayKey;
                        const isDisabled = !day.hasEvents;

                        return (
                          <button
                            key={day.key}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            aria-disabled={isDisabled}
                            tabIndex={isSelected ? 0 : -1}
                            className={cn(styles.dayButton, {
                              [styles.dayButtonActive]: isSelected,
                              [styles.dayButtonToday]: day.isToday && !isSelected,
                              [styles.dayButtonDisabled]: isDisabled && !isSelected,
                              [styles.dayButtonWeekend]: day.isWeekend && (!isSelected || isDisabled),
                            })}
                            onClick={() => handleDaySelect(day)}
                            ref={(element) => setDayRef(day.key, element)}
                          >
                            <span className={styles.dayButtonWeekday}>{day.weekdayShort}</span>
                            <span className={styles.dayButtonDate}>{day.dayNumber}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {selectedDayKey !== null && selectedDayEvents.length > 0 ? (
                  <SwipeableDayEvents
                    events={selectedDayEvents}
                    selectedDayKey={selectedDayKey}
                    calendarDays={calendarDays}
                    eventsByDate={eventsByDate}
                    pendingRegistrationIdsSet={pendingRegistrationIdsSet}
                    onRegister={handleRegister}
                    onUnregister={handleUnregister}
                    onNextDay={handleSwipeNextDay}
                    onPrevDay={handleSwipePrevDay}
                    canSwipeNext={canSwipeNext}
                    canSwipePrev={canSwipePrev}
                  />
                ) : null}
              </>
            )}

            {isEmptyState ? (
              <div className={styles.stateCard}>
                <CalendarIcon className={styles.stateIcon} aria-hidden />
                <p className={styles.stateTitle}>Событий не найдено</p>
                <p className={styles.stateMessage}>
                  {hasActiveFilters
                    ? 'Измените условия поиска или сбросьте фильтры.'
                    : 'Скоро здесь появятся новые мероприятия.'}
                </p>
              </div>
            ) : null}
          </>
        )}
      </PageTemplate>

      <BottomSheet
        isOpen={isRegisteredSheetOpen}
        onClose={handleCloseRegisteredSheet}
        title="Мои события"
        description={
          registeredEventsCount > 0 ? `Всего записей: ${registeredEventsCount}` : undefined
        }
        className={styles.sheet}
        contentClassName={styles.sheetContent}
      >
        {registeredEventsCount === 0 ? (
          <div className={styles.sheetEmptyState}>
            <CalendarIcon className={styles.sheetEmptyIcon} aria-hidden />
            <p className={styles.sheetEmptyTitle}>Нет записей на события</p>
            <p className={styles.sheetEmptyMessage}>
              Запишитесь на событие, чтобы увидеть его здесь.
            </p>
          </div>
        ) : (
          <>
            <RegisteredEventsSection title="Предстоящие" events={upcomingRegisteredEvents} />
            <RegisteredEventsSection title="Прошедшие" events={pastRegisteredEvents} />
          </>
        )}
      </BottomSheet>
    </>
  );
}

type SwipeableDayEventsProps = {
  events: ReadonlyArray<UniversityEvent>;
  selectedDayKey: string;
  calendarDays: ReadonlyArray<CalendarDay>;
  eventsByDate: Map<string, ReadonlyArray<UniversityEvent>>;
  pendingRegistrationIdsSet: ReadonlySet<string>;
  onRegister: EventCardProps['onRegister'];
  onUnregister: EventCardProps['onUnregister'];
  onNextDay: () => void;
  onPrevDay: () => void;
  canSwipeNext: boolean;
  canSwipePrev: boolean;
};

function SwipeableDayEvents({
  events,
  selectedDayKey,
  calendarDays,
  eventsByDate,
  pendingRegistrationIdsSet,
  onRegister,
  onUnregister,
  onNextDay,
  onPrevDay,
  canSwipeNext,
  canSwipePrev,
}: SwipeableDayEventsProps) {
  const {
    bindCardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    cardStyle,
    swipeDirection,
  } = useSwipe({
    onSwipeLeft: () => {
      if (canSwipeNext) {
        onNextDay();
      }
    },
    onSwipeRight: () => {
      if (canSwipePrev) {
        onPrevDay();
      }
    },
    isDisabled: !canSwipeNext && !canSwipePrev,
  });

  return (
    <div className={styles.swipeWrapper}>
      <div
        ref={bindCardRef}
        className={styles.selectedDayEventsWrapper}
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <ul className={styles.selectedDayEvents}>
          {events.map((event) => {
            const dayNumber = getEventDayNumber(event, selectedDayKey);
            const totalDays = getEventTotalDays(event);
            const multiDayDayNumber =
              totalDays > 1 && dayNumber > 0 ? Math.min(dayNumber, totalDays) : undefined;

            return (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      isRegistering={pendingRegistrationIdsSet.has(event.id)}
                      onRegister={onRegister}
                      onUnregister={onUnregister}
                      multiDayDayNumber={multiDayDayNumber}
                    />
                  </li>
            );
          })}
              </ul>

        <SwipeOverlay
          position="left"
          swipeDirection={swipeDirection}
          targetDay={getAdjacentDay(selectedDayKey, -1, calendarDays, eventsByDate)}
          label="Предыдущий день"
        />
        <SwipeOverlay
          position="right"
          swipeDirection={swipeDirection}
          targetDay={getAdjacentDay(selectedDayKey, 1, calendarDays, eventsByDate)}
          label="Следующий день"
        />
      </div>
    </div>
  );
}

type RegisteredEventsSectionProps = {
  title: string;
  events: ReadonlyArray<UniversityEvent>;
};

function RegisteredEventsSection({ title, events }: RegisteredEventsSectionProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className={styles.sheetSection}>
      <h3 className={styles.sheetSectionTitle}>{title}</h3>
      <ul className={styles.sheetList}>
        {events.map((event) => {
          const periodLabel = formatEventPeriod(event.startDateTime, event.endDateTime);
          const scheduleLabel =
            periodLabel.length > 0
              ? periodLabel
              : formatEventDateTime(event.startDateTime);
          const participantsLabel = formatParticipantsStatus(
            event.registeredParticipantsCount,
            event.participantsLimit,
          );

          return (
            <li key={event.id} className={styles.sheetItem}>
              <span className={styles.sheetItemTitle}>{event.title}</span>
              <span className={styles.sheetItemMeta}>{scheduleLabel}</span>
              <span className={styles.sheetItemMetaSecondary}>{event.location}</span>
              <span className={styles.sheetItemMetaSecondary}>{participantsLabel}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type SwipeOverlayProps = {
  position: 'left' | 'right';
  swipeDirection: 'left' | 'right' | null;
  targetDay: AdjacentDayInfo | null;
  label: string;
};

function SwipeOverlay({ position, swipeDirection, targetDay, label }: SwipeOverlayProps) {
  const isVisible =
    (position === 'right' && swipeDirection === 'left') ||
    (position === 'left' && swipeDirection === 'right');

  const className = cn(
    styles.swipeOverlay,
    position === 'right' ? styles.swipeOverlayRight : styles.swipeOverlayLeft,
    isVisible && styles.swipeOverlayVisible,
  );

  if (!targetDay) {
    const fallbackLabel =
      position === 'right' ? 'Нет следующих событий' : 'Нет предыдущих событий';

    return (
      <div className={className}>
        <span className={styles.swipeOverlayTitle}>{fallbackLabel}</span>
        </div>
    );
  }

  return (
    <div className={className}>
      <span className={styles.swipeOverlayTitle}>{label}</span>
      {isVisible ? (
        <>
          <span className={styles.swipeOverlaySubtitle}>{targetDay.dayLabel}</span>
          <span className={styles.swipeOverlaySubtitle}>
            {formatEventsCount(targetDay.eventsCount)}
          </span>
        </>
      ) : null}
    </div>
  );
}

function partitionEventsByDate(events: ReadonlyArray<UniversityEvent>) {
  const eventsByDate = new Map<string, UniversityEvent[]>();
  const unscheduledEvents: UniversityEvent[] = [];

  events.forEach((event) => {
    const startDate = getLocalDate(event.startDateTime);

    if (!startDate) {
      unscheduledEvents.push(event);
      return;
    }

    const endDate = getLocalDate(event.endDateTime) ?? startDate;
    const effectiveEnd = endDate.getTime() >= startDate.getTime() ? endDate : startDate;

    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate.getTime() <= effectiveEnd.getTime()) {
      const key = createDateKey(currentDate);
    const bucket = eventsByDate.get(key);

    if (bucket) {
      bucket.push(event);
    } else {
      eventsByDate.set(key, [event]);
      }

      currentDate = addDays(currentDate, 1);
    }
  });

  return { eventsByDate, unscheduledEvents };
}

function parseDateKeySafe(key: string): Date {
  const parts = key.split('-').map((value) => Number.parseInt(value, 10));

  if (parts.length === 3 && parts.every((part) => Number.isInteger(part))) {
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function createCalendarDays(
  eventsByDate: Map<string, UniversityEvent[]>,
  defaultTotalDays: number,
  defaultStartOffset: number,
): CalendarDay[] {
  const today = getToday();
  const eventKeys = Array.from(eventsByDate.keys()).sort();

  if (eventKeys.length === 0) {
    return createContinuousCalendarDays(
      addDays(today, defaultStartOffset),
      addDays(today, defaultStartOffset + defaultTotalDays - 1),
      eventsByDate,
      today,
    );
  }

  const firstEventDate = parseDateKeySafe(eventKeys[0]);
  const lastEventDate = parseDateKeySafe(eventKeys[eventKeys.length - 1]);

  const rangeStart = firstEventDate.getTime() <= today.getTime() ? firstEventDate : today;
  const rangeEnd = lastEventDate.getTime() >= today.getTime() ? lastEventDate : today;

  const continuousDays = createContinuousCalendarDays(rangeStart, rangeEnd, eventsByDate, today);

  if (continuousDays.length >= defaultTotalDays) {
    return continuousDays;
  }

  const missingDaysCount = defaultTotalDays - continuousDays.length;
  const additionalDays: CalendarDay[] = [];

  let currentDate = addDays(rangeEnd, 1);

  while (additionalDays.length < missingDaysCount) {
    const key = createDateKey(currentDate);
    const weekdayShort = calendarWeekdayFormatter.format(currentDate).toLocaleUpperCase('ru-RU');

    additionalDays.push({
      key,
      date: currentDate,
      dayNumber: String(currentDate.getDate()),
      weekdayShort,
      dayLabel: formatCalendarDayLabel(currentDate),
      hasEvents: false,
      isToday: currentDate.getTime() === today.getTime(),
      isWeekend: isWeekend(currentDate),
    });

    currentDate = addDays(currentDate, 1);
  }

  return [...continuousDays, ...additionalDays];
}

function createContinuousCalendarDays(
  startDate: Date,
  endDate: Date,
  eventsByDate: Map<string, UniversityEvent[]>,
  today: Date,
): CalendarDay[] {
  const normalizedStart = new Date(startDate);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(endDate);
  normalizedEnd.setHours(0, 0, 0, 0);

  if (normalizedEnd.getTime() < normalizedStart.getTime()) {
    return [];
  }

  const daysCount =
    Math.floor((normalizedEnd.getTime() - normalizedStart.getTime()) / MS_IN_DAY) + 1;

  return Array.from({ length: daysCount }, (_, index) => {
    const currentDate = addDays(normalizedStart, index);
    currentDate.setHours(0, 0, 0, 0);
    const key = createDateKey(currentDate);
    const events = eventsByDate.get(key) ?? [];
    const weekdayShort = calendarWeekdayFormatter.format(currentDate).toLocaleUpperCase('ru-RU');

    return {
      key,
      date: currentDate,
      dayNumber: String(currentDate.getDate()),
      weekdayShort,
      dayLabel: formatCalendarDayLabel(currentDate),
      hasEvents: events.length > 0,
      isToday: currentDate.getTime() === today.getTime(),
      isWeekend: isWeekend(currentDate),
    };
  });
}

type AdjacentDayInfo = {
  key: string;
  dayLabel: string;
  eventsCount: number;
};

function getAdjacentDay(
  currentKey: string,
  direction: 1 | -1,
  calendarDays: ReadonlyArray<CalendarDay>,
  eventsByDate: Map<string, ReadonlyArray<UniversityEvent>>,
): AdjacentDayInfo | null {
  const currentIndex = calendarDays.findIndex((day) => day.key === currentKey);

  if (currentIndex === -1) {
    return null;
  }

  for (
    let index = currentIndex + direction;
    index >= 0 && index < calendarDays.length;
    index += direction
  ) {
    const candidate = calendarDays[index];

    if (candidate.hasEvents) {
      const events = eventsByDate.get(candidate.key) ?? [];
      return {
        key: candidate.key,
        dayLabel: candidate.dayLabel,
        eventsCount: events.length,
      };
    }
  }

  return null;
 }
 
 function formatCalendarDayLabel(date: Date): string {
   return formatEventDay(toIsoAtNoon(date));
 }
 
 function toIsoAtNoon(date: Date): string {
   const copy = new Date(date);
   copy.setHours(12, 0, 0, 0);
   return copy.toISOString();
 }
 
 function capitalizeFirstLetter(value: string): string {
   if (value.length === 0) {
     return value;
   }
 
   return value.charAt(0).toUpperCase() + value.slice(1);
 }

function addDays(source: Date, days: number): Date {
  const result = new Date(source);
  result.setDate(result.getDate() + days);
  return result;
}

function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
 }
 
 function getLocalDate(isoString: string): Date | null {
   if (!isoString) {
     return null;
   }
 
   const date = new Date(isoString);
 
   if (Number.isNaN(date.getTime())) {
     return null;
   }
 
   return date;
 }
 
 function createDateKey(date: Date): string {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
 
   return `${year}-${month}-${day}`;
 }
 
function getEventDayNumber(event: UniversityEvent, dayKey: string): number {
  const startDate = getLocalDate(event.startDateTime);

  if (!startDate) {
    return 0;
  }

  const rawEndDate = getLocalDate(event.endDateTime);
  const endDate: Date = rawEndDate ?? startDate;

  const targetDate = parseDateKeySafe(dayKey);
  const startTime = truncateToDay(startDate).getTime();
  const endTime = truncateToDay(endDate).getTime();
  const targetTime = truncateToDay(targetDate).getTime();

  if (targetTime < startTime || targetTime > endTime) {
    return 0;
  }

  const diff = Math.round((targetTime - startTime) / MS_IN_DAY);
  return diff + 1;
}

function getEventTotalDays(event: UniversityEvent): number {
  const startDate = getLocalDate(event.startDateTime);

  if (!startDate) {
    return 1;
  }

  const rawEndDate = getLocalDate(event.endDateTime);
  const endDate: Date = rawEndDate ?? startDate;
  const startTime = truncateToDay(startDate).getTime();
  const endTime = Math.max(truncateToDay(endDate).getTime(), startTime);

  const diff = Math.round((endTime - startTime) / MS_IN_DAY);
  return diff + 1;
}

function truncateToDay(source: Date): Date {
  const date = new Date(source);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
 }

function formatEventsCount(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} событие`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} события`;
  }

  return `${count} событий`;
}

 function doesEventMatchSearch(event: UniversityEvent, tokens: ReadonlyArray<string>): boolean {
   if (tokens.length === 0) {
     return true;
   }
 
   const normalizedTitle = normalizeValue(event.title);
 
   return tokens.every((token) => normalizedTitle.includes(token));
 }
 
 function normalizeSearchQuery(value: string): string {
   const trimmed = value.trim();
 
   if (trimmed.length === 0) {
     return '';
   }
 
   return normalizeValue(trimmed);
 }
 
 function normalizeValue(value: string): string {
   return value
     .normalize('NFKD')
     .replace(/[\u0300-\u036f]/g, '')
     .toLowerCase();
 }
 
 function isAbortError(error: unknown): boolean {
   if (!error) {
     return false;
   }
 
   if (error instanceof DOMException) {
     return error.name === 'AbortError';
   }
 
   if (error instanceof Error) {
     return error.name === 'AbortError';
   }
 
   return false;
 }

function getEventsWord(value: number): string {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'событий';
  }

  if (lastDigit === 1) {
    return 'событие';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'события';
  }

  return 'событий';
}

