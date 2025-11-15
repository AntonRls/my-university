import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Spinner } from '@maxhub/max-ui';
import { toast } from 'sonner';

import { PageTemplate } from '@shared/ui/page-template';
import { ErrorState } from '@shared/ui/error-state';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { CalendarIcon, LocationIcon, LinkIcon, WifiIcon, NoteIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import type { ScheduleEntry } from '@api/schedule';
import { fetchMySchedule, createPersonalSlot, type CreatePersonalSlotPayload } from '@api/schedule';

import styles from './ScheduleScreen.module.scss';

type CategoryFilter = 'all' | 'lessons' | 'events' | 'personal';
type FormatFilter = 'all' | 'Offline' | 'Online';

type DayItem = {
  key: string;
  weekday: string;
  dayNumber: string;
  displayDate: string;
  hasEntries: boolean;
  isToday: boolean;
};

const CATEGORY_FILTERS: ReadonlyArray<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'lessons', label: 'Пары' },
  { id: 'events', label: 'События' },
  { id: 'personal', label: 'Мои заметки' },
];

const FORMAT_FILTERS: ReadonlyArray<{ id: FormatFilter; label: string }> = [
  { id: 'all', label: 'Все форматы' },
  { id: 'Offline', label: 'Офлайн' },
  { id: 'Online', label: 'Онлайн' },
];

const FETCH_PAST_DAYS = 2;
const INITIAL_FETCH_FUTURE_DAYS = 90; // Загружаем 3 месяца для поиска последней записи
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
const dayTitleFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

type PersonalSlotFormState = {
  title: string;
  description: string;
  teacher: string;
  deliveryType: 'Offline' | 'Online';
  physicalLocation: string;
  onlineLink: string;
  startDateTime: string;
  endDateTime: string;
};

function createDefaultPersonalSlotFormState(selectedDate?: Date): PersonalSlotFormState {
  const baseDate = selectedDate ?? new Date();
  const start = new Date(baseDate);
  start.setMinutes(0, 0, 0);
  
  // Если выбранная дата - сегодня, ставим время на час вперед
  // Если будущая дата, ставим на 9:00
  const now = new Date();
  const isToday = formatDateKey(start) === formatDateKey(now);
  
  if (isToday) {
    start.setHours(now.getHours() + 1);
  } else {
    start.setHours(9, 0, 0);
  }
  
  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    title: '',
    description: '',
    teacher: '',
    deliveryType: 'Offline',
    physicalLocation: '',
    onlineLink: '',
    startDateTime: toDateTimeLocal(start.toISOString()),
    endDateTime: toDateTimeLocal(end.toISOString()),
  };
}

function toDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function ScheduleScreen() {
  const [entries, setEntries] = useState<ReadonlyArray<ScheduleEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(todayKey);
  const [isPersonalSlotSheetOpen, setIsPersonalSlotSheetOpen] = useState(false);
  const [personalSlotFormState, setPersonalSlotFormState] = useState<PersonalSlotFormState>(
    createDefaultPersonalSlotFormState,
  );
  const [isSubmittingPersonalSlot, setIsSubmittingPersonalSlot] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadSchedule = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Сначала загружаем большой диапазон для поиска последней записи
      const from = startOfDay(addDays(new Date(), -FETCH_PAST_DAYS)).toISOString();
      const initialTo = endOfDay(addDays(new Date(), INITIAL_FETCH_FUTURE_DAYS)).toISOString();
      const initialResult = await fetchMySchedule({
        from,
        to: initialTo,
        signal: controller.signal,
      });

      // Находим максимальную дату из всех записей
      let maxDate = addDays(new Date(), INITIAL_FETCH_FUTURE_DAYS);
      if (initialResult.length > 0) {
        const maxEntryDate = initialResult.reduce((max: Date, entry: ScheduleEntry) => {
          const entryDate = new Date(entry.endsAt);
          return entryDate > max ? entryDate : max;
        }, new Date(initialResult[0].endsAt));
        maxDate = maxEntryDate > new Date() ? maxEntryDate : addDays(new Date(), INITIAL_FETCH_FUTURE_DAYS);
      }

      // Загружаем до последней записи
      const finalTo = endOfDay(maxDate).toISOString();
      const result = await fetchMySchedule({
        from,
        to: finalTo,
        signal: controller.signal,
      });
      setEntries(result);
    } catch (requestError) {
      if (isAbortError(requestError)) {
        return;
      }
      console.error('[schedule] failed to load entries', requestError);
      setError('Не удалось загрузить расписание');
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadSchedule]);

  const normalizedEntries = useMemo(() => entries ?? [], [entries]);

  const entriesByDay = useMemo(() => groupEntriesByDay(normalizedEntries), [normalizedEntries]);

  const dayItems = useMemo(() => {
    // Показываем все дни с записями + сегодня и несколько дней вперед для навигации
    const daySet = new Set<string>();
    
    // Добавляем сегодня и несколько дней вперед для навигации
    const today = parseDateKey(todayKey);
    for (let i = -1; i < 7; i += 1) {
      daySet.add(formatDateKey(addDays(today, i)));
    }
    
    // Добавляем все дни с записями
    entriesByDay.forEach((_, key) => daySet.add(key));

    return Array.from(daySet)
      .sort((a, b) => parseDateKey(a).getTime() - parseDateKey(b).getTime())
      .map((key) => createDayItem(key, entriesByDay, todayKey));
  }, [entriesByDay, todayKey]);

  useEffect(() => {
    if (dayItems.length === 0) {
      return;
    }

    const exists = dayItems.some((day) => day.key === selectedDayKey);
    if (!exists) {
      const fallback =
        dayItems.find((day) => day.isToday) ??
        dayItems.find((day) => day.hasEntries) ??
        dayItems[0];
      setSelectedDayKey(fallback.key);
    }
  }, [dayItems, selectedDayKey]);

  const filteredEntries = useMemo(() => {
    if (!selectedDayKey) {
      return [];
    }

    const dayEntries = entriesByDay.get(selectedDayKey) ?? [];
    return dayEntries
      .filter((entry) => matchesCategory(entry, categoryFilter))
      .filter((entry) => matchesFormat(entry, formatFilter))
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
          new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
      );
  }, [entriesByDay, selectedDayKey, categoryFilter, formatFilter]);

  const shouldShowSkeleton = isLoading && entries === null;
  const hasAnyEntries = normalizedEntries.length > 0;
  const isSelectedDayEmpty = !isLoading && !error && hasAnyEntries && filteredEntries.length === 0;
  const isGlobalEmpty = !isLoading && !error && !hasAnyEntries;

  const handleAddPersonalSlot = useCallback((selectedDate?: Date) => {
    if (selectedDate) {
      setPersonalSlotFormState(createDefaultPersonalSlotFormState(selectedDate));
    } else {
      setPersonalSlotFormState(createDefaultPersonalSlotFormState());
    }
    setIsPersonalSlotSheetOpen(true);
  }, []);

  const handleClosePersonalSlotSheet = useCallback(() => {
    setIsPersonalSlotSheetOpen(false);
    setPersonalSlotFormState(() => createDefaultPersonalSlotFormState());
  }, []);

  const handlePersonalSlotFormChange = useCallback(
    (field: keyof PersonalSlotFormState, value: string) => {
      setPersonalSlotFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSubmitPersonalSlot = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const startDate = new Date(personalSlotFormState.startDateTime);
      const endDate = new Date(personalSlotFormState.endDateTime);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        toast.error('Укажите корректные дату и время');
        return;
      }

      if (startDate >= endDate) {
        toast.error('Время окончания должно быть позже времени начала');
        return;
      }

      if (!personalSlotFormState.title.trim()) {
        toast.error('Укажите название активности');
        return;
      }

      if (personalSlotFormState.deliveryType === 'Offline' && !personalSlotFormState.physicalLocation.trim()) {
        toast.error('Для офлайн-активности укажите место');
        return;
      }

      if (personalSlotFormState.deliveryType === 'Online' && !personalSlotFormState.onlineLink.trim()) {
        toast.error('Для онлайн-активности укажите ссылку');
        return;
      }

      setIsSubmittingPersonalSlot(true);

      try {
        const payload: CreatePersonalSlotPayload = {
          title: personalSlotFormState.title.trim(),
          description: personalSlotFormState.description.trim() || null,
          teacher: personalSlotFormState.teacher.trim() || null,
          deliveryType: personalSlotFormState.deliveryType,
          physicalLocation: personalSlotFormState.physicalLocation.trim() || null,
          onlineLink: personalSlotFormState.onlineLink.trim() || null,
          startsAt: startDate.toISOString(),
          endsAt: endDate.toISOString(),
        };

        await createPersonalSlot(payload);
        toast.success('Личная активность добавлена');
        handleClosePersonalSlotSheet();
        void loadSchedule();
      } catch (submitError) {
        console.error('[schedule] failed to create personal slot', submitError);
        toast.error('Не удалось добавить активность');
      } finally {
        setIsSubmittingPersonalSlot(false);
      }
    },
    [personalSlotFormState, loadSchedule, handleClosePersonalSlotSheet],
  );

  const handleRefresh = useCallback(() => {
    void loadSchedule();
  }, [loadSchedule]);

  return (
    <PageTemplate
      title={['Моё', 'расписание']}
      actions={(
        <div className={styles.actions}>
          <Button
            type="button"
            size="small"
            mode="primary"
            appearance="themed"
            className={styles.syncButton}
            onClick={() => handleAddPersonalSlot()}
            aria-label="Добавить личную активность"
          >
            <NoteIcon size={20} />
          </Button>
        </div>
      )}
      contentClassName={styles.content}
    >
      {error ? (
        <ErrorState title="Не удалось загрузить расписание" onRetry={handleRefresh} />
      ) : (
        <>
          <section className={styles.filters}>
            <div className={styles.chipGroup} aria-label="Тип события">
              {CATEGORY_FILTERS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={cn(styles.chip, categoryFilter === chip.id && styles.chipActive)}
                  onClick={() => setCategoryFilter(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            <div className={styles.formatGroup} aria-label="Формат занятий">
              {FORMAT_FILTERS.map((format) => (
                <button
                  key={format.id}
                  type="button"
                  className={cn(styles.chip, formatFilter === format.id && styles.chipActive)}
                  onClick={() => setFormatFilter(format.id)}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className={styles.dayCarousel} role="tablist" aria-label="Выбор дня">
              {dayItems.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  className={cn(
                    styles.dayButton,
                    day.isToday && styles.dayButtonToday,
                    day.key === selectedDayKey && styles.dayButtonSelected,
                  )}
                  aria-pressed={day.key === selectedDayKey}
                  onClick={() => setSelectedDayKey(day.key)}
                >
                  <span className={styles.dayButtonBadge}>{day.weekday}</span>
                  <span className={styles.dayButtonDay}>{day.dayNumber}</span>
                  {day.hasEntries ? <span className={styles.dayButtonBadge}>занятия есть</span> : null}
                </button>
              ))}
            </div>
          </section>

          {shouldShowSkeleton ? (
            <div className={styles.skeletonList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.skeletonItem} />
              ))}
            </div>
          ) : null}

          {!isLoading && !error ? (
            <>
              {isGlobalEmpty ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyStateTitle}>Пока нет занятий</span>
                  <span className={styles.emptyStateDescription}>
                    Когда появятся пары, события или личные заметки, они отобразятся здесь автоматически.
                  </span>
                  <Button
                    type="button"
                    size="medium"
                    mode="primary"
                    appearance="themed"
                    onClick={() => handleAddPersonalSlot()}
                  >
                    <NoteIcon size={16} />
                    Добавить активность
                  </Button>
                </div>
              ) : (
                <div className={styles.timeline}>
                  {filteredEntries.map((entry) => (
                    <div key={entry.id} className={styles.timelineItem}>
                      <div className={styles.timeColumn}>{formatTimeRange(entry)}</div>
                      <article className={styles.entryCard}>
                        <div
                          className={cn(
                            styles.entryAccent,
                            getAccentClassName(entry),
                          )}
                        />
                        <div className={styles.entryContent}>
                          <header className={styles.cardHeader}>
                            <span className={cn(styles.badge, getBadgeClassName(entry))}>
                              {getSourceLabel(entry)}
                            </span>
                            <span className={styles.badge}>
                              <CalendarIcon size={16} aria-hidden />
                              {entry.deliveryType === 'Online' ? 'Онлайн' : 'Офлайн'}
                            </span>
                          </header>
                          <h2 className={styles.cardTitle}>{entry.title}</h2>
                          <div className={styles.cardMeta}>
                            {entry.teacher ? (
                              <div className={styles.metaRow}>Преподаватель: {entry.teacher}</div>
                            ) : null}
                            {renderLocation(entry)}
                            {entry.description ? <p>{entry.description}</p> : null}
                          </div>
                          <div className={styles.divider} />
                          <div className={styles.pillGroup}>
                            {entry.isPersonal ? <span className={styles.pill}>Персонально</span> : null}
                            {entry.groupId ? (
                              <span className={styles.pill}>Группа #{entry.groupId}</span>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {isSelectedDayEmpty ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateTitle}>Свободный день</span>
              <span className={styles.emptyStateDescription}>
                На выбранный день занятий нет. Добавьте личную заметку, чтобы напомнить себе о подготовке.
              </span>
              <Button
                type="button"
                size="medium"
                mode="primary"
                appearance="themed"
                onClick={() => {
                  const selectedDate = parseDateKey(selectedDayKey);
                  handleAddPersonalSlot(selectedDate);
                }}
              >
                <NoteIcon size={16} />
                Добавить активность
              </Button>
            </div>
          ) : null}

          {isLoading && entries !== null ? (
            <div className={styles.metaRow}>
              <Spinner size={20} />
              <span>Обновляем расписание...</span>
            </div>
          ) : null}
        </>
      )}

      <BottomSheet
        isOpen={isPersonalSlotSheetOpen}
        onClose={handleClosePersonalSlotSheet}
        title="Добавить личную активность"
      >
        <form className={styles.sheetContent} onSubmit={handleSubmitPersonalSlot}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="personal-slot-title">
              Название <span className={styles.required}>*</span>
            </label>
            <input
              id="personal-slot-title"
              className={styles.input}
              type="text"
              required
              maxLength={120}
              value={personalSlotFormState.title}
              onChange={(event) => handlePersonalSlotFormChange('title', event.target.value)}
              placeholder="Например: Подготовка к экзамену"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="personal-slot-description">
              Описание
            </label>
            <textarea
              id="personal-slot-description"
              className={styles.textarea}
              rows={3}
              value={personalSlotFormState.description}
              onChange={(event) => handlePersonalSlotFormChange('description', event.target.value)}
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="personal-slot-teacher">
              Преподаватель / Организатор
            </label>
            <input
              id="personal-slot-teacher"
              className={styles.input}
              type="text"
              value={personalSlotFormState.teacher}
              onChange={(event) => handlePersonalSlotFormChange('teacher', event.target.value)}
              placeholder="Необязательно"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="personal-slot-delivery">
              Формат <span className={styles.required}>*</span>
            </label>
            <select
              id="personal-slot-delivery"
              className={styles.select}
              value={personalSlotFormState.deliveryType}
              onChange={(event) =>
                handlePersonalSlotFormChange('deliveryType', event.target.value as 'Offline' | 'Online')
              }
            >
              <option value="Offline">Офлайн</option>
              <option value="Online">Онлайн</option>
            </select>
          </div>

          {personalSlotFormState.deliveryType === 'Offline' ? (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="personal-slot-location">
                Место <span className={styles.required}>*</span>
              </label>
              <input
                id="personal-slot-location"
                className={styles.input}
                type="text"
                required={personalSlotFormState.deliveryType === 'Offline'}
                value={personalSlotFormState.physicalLocation}
                onChange={(event) => handlePersonalSlotFormChange('physicalLocation', event.target.value)}
                placeholder="Аудитория, адрес и т.д."
              />
            </div>
          ) : (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="personal-slot-link">
                Ссылка <span className={styles.required}>*</span>
              </label>
              <input
                id="personal-slot-link"
                className={styles.input}
                type="url"
                required={personalSlotFormState.deliveryType === 'Online'}
                value={personalSlotFormState.onlineLink}
                onChange={(event) => handlePersonalSlotFormChange('onlineLink', event.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="personal-slot-start">
                Начало <span className={styles.required}>*</span>
              </label>
              <input
                id="personal-slot-start"
                className={styles.input}
                type="datetime-local"
                required
                value={personalSlotFormState.startDateTime}
                onChange={(event) => handlePersonalSlotFormChange('startDateTime', event.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="personal-slot-end">
                Окончание <span className={styles.required}>*</span>
              </label>
              <input
                id="personal-slot-end"
                className={styles.input}
                type="datetime-local"
                required
                value={personalSlotFormState.endDateTime}
                onChange={(event) => handlePersonalSlotFormChange('endDateTime', event.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="large"
            mode="primary"
            appearance="themed"
            disabled={isSubmittingPersonalSlot}
            className={styles.submitButton}
          >
            {isSubmittingPersonalSlot ? 'Добавляем...' : 'Добавить'}
          </Button>
        </form>
      </BottomSheet>
    </PageTemplate>
  );
}

function matchesCategory(entry: ScheduleEntry, filter: CategoryFilter) {
  if (filter === 'all') {
    return true;
  }

  const entryCategory = getEntryCategory(entry);
  return entryCategory === filter;
}

function matchesFormat(entry: ScheduleEntry, filter: FormatFilter) {
  if (filter === 'all') {
    return true;
  }
  return entry.deliveryType === filter;
}

function getEntryCategory(entry: ScheduleEntry): CategoryFilter {
  switch (entry.source.type) {
    case 'AdminLesson':
      return 'lessons';
    case 'UniversityEvent':
      return 'events';
    case 'ManualPersonal':
      return 'personal';
    default:
      return 'all';
  }
}

function getSourceLabel(entry: ScheduleEntry) {
  const category = getEntryCategory(entry);
  if (category === 'lessons') {
    return 'Пара';
  }
  if (category === 'events') {
    return 'Событие';
  }
  if (category === 'personal') {
    return 'Личная заметка';
  }
  return 'Активность';
}

function renderLocation(entry: ScheduleEntry) {
  if (entry.deliveryType === 'Online' && entry.onlineLink) {
    return (
      <a href={entry.onlineLink} className={cn(styles.metaRow, styles.metaLink)} target="_blank" rel="noreferrer">
        <WifiIcon size={16} aria-hidden />
        Перейти по ссылке
      </a>
    );
  }

  if (entry.deliveryType === 'Offline' && entry.physicalLocation) {
    return (
      <div className={styles.metaRow}>
        <LocationIcon size={16} aria-hidden />
        {entry.physicalLocation}
      </div>
    );
  }

  if (entry.onlineLink) {
    return (
      <a href={entry.onlineLink} className={cn(styles.metaRow, styles.metaLink)} target="_blank" rel="noreferrer">
        <LinkIcon size={16} aria-hidden />
        Ссылка
      </a>
    );
  }

  return null;
}

function getBadgeClassName(entry: ScheduleEntry) {
  const category = getEntryCategory(entry);
  if (category === 'lessons') {
    return styles.badgeLessons;
  }
  if (category === 'events') {
    return styles.badgeEvents;
  }
  if (category === 'personal') {
    return styles.badgePersonal;
  }
  return undefined;
}

function getAccentClassName(entry: ScheduleEntry) {
  const category = getEntryCategory(entry);
  if (category === 'lessons') {
    return styles.entryAccentLessons;
  }
  if (category === 'events') {
    return styles.entryAccentEvents;
  }
  if (category === 'personal') {
    return styles.entryAccentPersonal;
  }
  return undefined;
}

function formatTimeRange(entry: ScheduleEntry) {
  const start = timeFormatter.format(new Date(entry.startsAt));
  const end = timeFormatter.format(new Date(entry.endsAt));
  return `${start} — ${end}`;
}


function groupEntriesByDay(list: ReadonlyArray<ScheduleEntry>) {
  const map = new Map<string, ScheduleEntry[]>();
  for (const entry of list) {
    const key = formatDateKey(new Date(entry.startsAt));
    const current = map.get(key) ?? [];
    current.push(entry);
    map.set(key, current);
  }
  return map;
}

function createDayItem(key: string, entriesByDay: Map<string, ScheduleEntry[]>, todayKey: string): DayItem {
  const date = parseDateKey(key);
  const weekday = capitalizeFirstLetter(weekdayFormatter.format(date));
  const dayNumber = String(date.getDate()).padStart(2, '0');
  const hasEntries = (entriesByDay.get(key)?.length ?? 0) > 0;
  return {
    key,
    weekday,
    dayNumber,
    displayDate: dayTitleFormatter.format(date),
    hasEntries,
    isToday: key === todayKey,
  };
}

function capitalizeFirstLetter(value: string) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * MILLISECONDS_IN_DAY);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isAbortError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'AbortError';
}
