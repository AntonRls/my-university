/* eslint-env browser */
/// <reference lib="dom" />
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EditIcon, PlusIcon, RefreshIcon, TrashIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  createUniversityEvent,
  deleteUniversityEvent,
  fetchUniversityEventTags,
  fetchUniversityEvents,
  updateUniversityEvent,
  type EventTag,
  type UniversityEvent,
} from '@api/admin';
import { formatParticipantsStatus } from '@entities/event';

import { PageShell } from '../../../shared/layout/index.ts';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
  Textarea,
} from '../../../shared/ui/index.ts';

type FormMode = 'create' | 'edit';

type EventFormState = {
  id: number | null;
  title: string;
  description: string;
  location: string;
  participantsLimit: string;
  startDateTime: string;
  endDateTime: string;
  tagIds: ReadonlyArray<string>;
};

const EMPTY_FORM_STATE: EventFormState = createDefaultFormState();

export function AdminEventsPage(): ReactElement {
  const [formState, setFormState] = useState<EventFormState>(EMPTY_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [events, setEvents] = useState<ReadonlyArray<UniversityEvent>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [isEventsRefreshing, setIsEventsRefreshing] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<EventTag>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);

  const selectedTagsSet = useMemo(() => new Set(formState.tagIds), [formState.tagIds]);

  const loadTags = useCallback(async () => {
    setIsTagsLoading(true);

    try {
      const result = await fetchUniversityEventTags();
      setTags(result);
    } catch (error: unknown) {
      console.error('[admin-events] failed to load tags', error);
      toast.error('Не удалось загрузить теги событий');
      setTags([]);
    } finally {
      setIsTagsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

      if (isSilent) {
        setIsEventsRefreshing(true);
      } else {
        setIsEventsLoading(true);
      }

      setEventsError(null);

      try {
        const result = await fetchUniversityEvents();
        setEvents(result);
      } catch (error: unknown) {
        console.error('[admin-events] failed to load events', error);
        setEventsError('Не удалось загрузить список событий');
      } finally {
        if (isSilent) {
          setIsEventsRefreshing(false);
        } else {
          setIsEventsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadTags();
    void loadEvents();
  }, [loadEvents, loadTags]);

  useEffect(() => {
    if (tags.length === 0) {
      setFormState((previous) => ({
        ...previous,
        tagIds: [],
      }));
      return;
    }

    setFormState((previous) => ({
      ...previous,
      tagIds: previous.tagIds.filter((tagId) => tags.some((tag) => tag.id === tagId)),
    }));
  }, [tags]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | globalThis.HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormError(null);
      setFormState((previous) => ({
        ...previous,
        [name]: value,
      }));
    },
    [],
  );

  const handleTagToggle = useCallback((tagId: string) => {
    setFormState((previous) => {
      const hasTag = previous.tagIds.includes(tagId);

      if (hasTag) {
        return {
          ...previous,
          tagIds: previous.tagIds.filter((id) => id !== tagId),
        };
      }

      return {
        ...previous,
        tagIds: [...previous.tagIds, tagId],
      };
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormError(null);
    setFormMode('create');
    const start = createDefaultStartDate();
    setFormState({
      id: null,
      title: '',
      description: '',
      location: '',
      participantsLimit: '',
      startDateTime: start,
      endDateTime: createDefaultEndDate(start),
      tagIds: [],
    });
  }, []);

  const handleEditEvent = useCallback(
    (event: UniversityEvent) => {
      setFormMode('edit');
      setFormError(null);
      setFormState({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        participantsLimit: event.participantsLimit ? String(event.participantsLimit) : '',
        startDateTime: toDateTimeLocal(event.startDateTime),
        endDateTime: toDateTimeLocal(event.endDateTime),
        tagIds: event.tags.map((tag) => tag.id),
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = formState.title.trim();
      const trimmedDescription = formState.description.trim();
      const trimmedLocation = formState.location.trim();

      if (!trimmedTitle) {
        setFormError('Введите название события.');
        return;
      }

      if (!trimmedDescription) {
        setFormError('Добавьте описание события.');
        return;
      }

      if (!trimmedLocation) {
        setFormError('Укажите место проведения события.');
        return;
      }

      if (!formState.startDateTime || !formState.endDateTime) {
        setFormError('Укажите дату и время начала и окончания.');
        return;
      }

      const startIso = toIsoString(formState.startDateTime);
      const endIso = toIsoString(formState.endDateTime);

      if (!startIso || !endIso) {
        setFormError('Некорректный формат даты. Обновите значения и попробуйте снова.');
        return;
      }

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        setFormError('Время окончания должно быть позже времени начала.');
        return;
      }

      const limitValue = formState.participantsLimit.trim();
      let normalizedLimit: number | null = null;

      if (limitValue.length > 0) {
        const parsed = Number(limitValue);

        if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
          setFormError('Количество мест должно быть положительным числом.');
          return;
        }

        normalizedLimit = Math.round(parsed);
      }

      const selectedTags = resolveSelectedTags(formState.tagIds, tags);

      if (formState.tagIds.length > 0 && selectedTags.length === 0) {
        setFormError('Не удалось сопоставить выбранные теги. Обновите страницу и попробуйте снова.');
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      try {
        const payload = {
          title: trimmedTitle,
          description: trimmedDescription,
          location: trimmedLocation,
          participantsLimit: normalizedLimit,
          startDateTime: startIso,
          endDateTime: endIso,
          tags: selectedTags,
        };

        if (formMode === 'edit' && formState.id !== null) {
          await updateUniversityEvent(formState.id, payload);
          toast.success('Событие обновлено');
        } else {
          await createUniversityEvent(payload);
          toast.success('Событие создано');
        }

        resetForm();
        await loadEvents({ silent: true });
      } catch (submitError: unknown) {
        console.error('[admin-events] failed to submit form', submitError);
        toast.error('Не удалось сохранить событие');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMode, formState, loadEvents, resetForm, tags],
  );

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      // eslint-disable-next-line no-alert
      const confirmDelete = window.confirm('Удалить событие? Действие нельзя отменить.');

      if (!confirmDelete) {
        return;
      }

      setDeletingEventId(eventId);

      try {
        await deleteUniversityEvent(eventId);
        toast.success('Событие удалено');

        if (formState.id === eventId) {
          resetForm();
        }

        await loadEvents({ silent: true });
      } catch (deleteError: unknown) {
        console.error('[admin-events] failed to delete event', deleteError);
        toast.error('Не удалось удалить событие');
      } finally {
        setDeletingEventId(null);
      }
    },
    [formState.id, loadEvents, resetForm],
  );

  const handleRefresh = useCallback(() => {
    void loadEvents({ silent: true });
    void loadTags();
  }, [loadEvents, loadTags]);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const eventsCount = events.length;
  const activeEventId = formMode === 'edit' ? formState.id : null;

  return (
    <PageShell
      title="Управление событиями"
      description="Создавайте, редактируйте и модерируйте мероприятия университета."
      actions={
        <Button onClick={handleRefresh} variant="secondary" isLoading={isEventsRefreshing || isTagsLoading}>
          <span className="inline-flex items-center gap-2">
          <RefreshIcon size={16} />
          Обновить
          </span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="space-y-2">
            <Badge variant="outline" className="w-fit">
              {formMode === 'edit' ? 'Редактирование' : 'Новая запись'}
            </Badge>
            <CardTitle>{formMode === 'edit' ? 'Редактирование события' : 'Новое событие'}</CardTitle>
            <CardDescription>
              Настройте даты, описание и ограничение по участникам. Теги помогают быстро находить события в приложении.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError ? (
              <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {formError}
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <label htmlFor="title">Название</label>
                  <span>{formState.title.length}/120</span>
                </div>
                <Input
                  id="title"
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  placeholder="Например, День открытых дверей"
                  maxLength={120}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm text-muted-foreground">
                  Описание
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  placeholder="Расскажите, что ожидает участников на событии"
                  maxLength={2000}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Дата начала</label>
                  <Input
                    type="datetime-local"
                    name="startDateTime"
                    value={formState.startDateTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Дата окончания</label>
                  <Input
                    type="datetime-local"
                    name="endDateTime"
                    value={formState.endDateTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm text-muted-foreground">
                    Место проведения
                  </label>
                  <Input
                    id="location"
                    name="location"
                    value={formState.location}
                    onChange={handleInputChange}
                    placeholder="Например, Актовый зал, корпус B"
                    maxLength={120}
                    autoComplete="off"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="participantsLimit" className="text-sm text-muted-foreground">
                    Лимит участников
                  </label>
                  <Input
                    id="participantsLimit"
                    name="participantsLimit"
                    value={formState.participantsLimit}
                    onChange={handleInputChange}
                    placeholder="Например, 120"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Теги</span>
                  <span className="text-xs text-muted-foreground">
                    {isTagsLoading ? 'Загрузка...' : `${tags.length} доступно`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Пока нет тегов. Создайте их в сервисе событий, чтобы упрощать фильтрацию.
                    </p>
                  ) : null}
                  {tags.map((tag) => {
                    const isSelected = selectedTagsSet.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          'rounded-full border px-4 py-1 text-xs font-medium transition',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/60',
                        )}
                      >
                        #{tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" isLoading={isSubmitting} className="flex-1">
                  <span className="inline-flex items-center gap-2">
                  <PlusIcon size={16} />
                  {formMode === 'edit' ? 'Сохранить изменения' : 'Создать событие'}
                  </span>
                </Button>
                {formMode === 'edit' ? (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                    Отменить
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Список событий</CardTitle>
              <CardDescription>
                {eventsCount === 0 ? 'Нет активных событий' : `${eventsCount} в расписании`}
              </CardDescription>
            </div>
            <Badge variant="outline">{isEventsLoading ? 'Загрузка...' : 'Актуальные данные'}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventsError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {eventsError}
                <Button
                  variant="ghost"
                  className="mt-2 px-0 text-destructive-foreground underline"
                  onClick={() => {
                    void loadEvents();
                  }}
                >
                  Повторить попытку
                </Button>
              </div>
            ) : null}

            {isEventsLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                <Spinner size={20} />
                Загружаем события...
              </div>
            ) : null}

            {!isEventsLoading && events.length === 0 && !eventsError ? (
              <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                Событий пока нет. Добавьте новое мероприятие, чтобы студенты видели его в приложении.
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {events.map((event) => {
                const isActive = activeEventId === event.id;
                return (
                  <article
                    key={event.id}
                    className={cn(
                      'rounded-2xl border border-border/70 bg-card/40 p-4 shadow-md shadow-black/10 transition hover:border-primary/50',
                      isActive && 'border-primary/70 shadow-lg shadow-primary/10',
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <span className="text-xs uppercase tracking-widest text-primary">
                        {formatEventTimeRange(event)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{event.location}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatParticipantsStatus(
                        event.registeredParticipantsCount,
                        event.participantsLimit,
                      )}
                    </p>
                    {event.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <Badge key={tag.id} variant="outline">
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">Теги не назначены</p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEditEvent(event)}
                        disabled={isSubmitting || deletingEventId !== null}
                      >
                        <span className="inline-flex items-center gap-2">
                        <EditIcon size={16} />
                        Редактировать
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteEvent(event.id)}
                        isLoading={deletingEventId === event.id}
                        disabled={
                          isSubmitting || (deletingEventId !== null && deletingEventId !== event.id)
                        }
                        aria-label={`Удалить событие ${event.title}`}
                      >
                        <span className="inline-flex items-center gap-2">
                        <TrashIcon size={16} />
                        Удалить
                        </span>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function resolveSelectedTags(
  tagIds: ReadonlyArray<string>,
  allTags: ReadonlyArray<EventTag>,
): ReadonlyArray<EventTag> {
  const tagsMap = new Map(allTags.map((tag) => [tag.id, tag]));

  return tagIds
    .map((tagId) => tagsMap.get(tagId))
    .filter((tag): tag is EventTag => Boolean(tag));
}

function createDefaultFormState(): EventFormState {
  const start = createDefaultStartDate();

  return {
    id: null,
    title: '',
    description: '',
    location: '',
    participantsLimit: '',
    startDateTime: start,
    endDateTime: createDefaultEndDate(start),
    tagIds: [],
  };
}

function createDefaultStartDate(): string {
  const now = new Date();
  const nextHour = new Date(now.getTime());
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return toDateTimeLocal(nextHour.toISOString());
}

function createDefaultEndDate(start: string): string {
  const startDate = new Date(start);

  if (Number.isNaN(startDate.getTime())) {
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 2);
    return toDateTimeLocal(fallback.toISOString());
  }

  const endDate = new Date(startDate.getTime());
  endDate.setHours(endDate.getHours() + 2);
  return toDateTimeLocal(endDate.toISOString());
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

function toIsoString(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatEventTimeRange(event: UniversityEvent): string {
  if (!event.startDateTime || !event.endDateTime) {
    return 'Время уточняется';
  }

  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Время уточняется';
  }

  const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
  });

  const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatter.format(start)}, ${timeFormatter.format(start)} — ${timeFormatter.format(end)}`;
}

