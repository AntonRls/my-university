/* eslint-env browser */
/// <reference lib="dom" />
import type { ReactElement } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { PlusIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  createUniversityEventTag,
  fetchUniversityEvent,
  fetchUniversityEventTags,
  updateUniversityEvent,
  type EventTag,
  type UniversityEvent,
} from '@api/admin';

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

type EventFormState = {
  title: string;
  description: string;
  location: string;
  participantsLimit: string;
  startDateTime: string;
  endDateTime: string;
  tagIds: ReadonlyArray<string>;
};

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

function createFormStateFromEvent(event: UniversityEvent): EventFormState {
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    participantsLimit: event.participantsLimit ? String(event.participantsLimit) : '',
    startDateTime: toDateTimeLocal(event.startDateTime),
    endDateTime: toDateTimeLocal(event.endDateTime),
    tagIds: event.tags.map((tag) => tag.id),
  };
}

export function EditEventPage(): ReactElement {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const [formState, setFormState] = useState<EventFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tags, setTags] = useState<ReadonlyArray<EventTag>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const selectedTagsSet = useMemo(() => new Set(formState?.tagIds ?? []), [formState?.tagIds]);

  const validationErrors = useMemo(() => {
    if (!formState) {
      return [];
    }

    const errors: Array<string> = [];

    if (!formState.title.trim()) {
      errors.push('Название события обязательно');
    }

    if (!formState.description.trim()) {
      errors.push('Описание события обязательно');
    }

    if (!formState.location.trim()) {
      errors.push('Место проведения обязательно');
    }

    const startDateTime = toIsoString(formState.startDateTime);
    const endDateTime = toIsoString(formState.endDateTime);

    if (!startDateTime) {
      errors.push('Дата начала обязательна');
    }

    if (!endDateTime) {
      errors.push('Дата окончания обязательна');
    }

    if (startDateTime && endDateTime && new Date(startDateTime) >= new Date(endDateTime)) {
      errors.push('Дата окончания должна быть позже даты начала');
    }

    return errors;
  }, [formState]);

  const isFormValid = formState !== null && validationErrors.length === 0;

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

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setLoadError('ID события не указан');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const event = await fetchUniversityEvent(Number.parseInt(eventId, 10));
      setFormState(createFormStateFromEvent(event));
    } catch (error: unknown) {
      console.error('[admin-events] failed to load event', error);
      setLoadError('Не удалось загрузить событие');
      toast.error('Не удалось загрузить событие');
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadEvent();
    void loadTags();
  }, [loadEvent, loadTags]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as { name: string; value: string };
      const { name, value } = target;
      setFormState((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, [name]: value };
      });
      setFormError(null);
    },
    [],
  );

  const handleTagToggle = useCallback(
    (tagId: string) => {
      setFormState((prev) => {
        if (!prev) {
          return null;
        }
        const currentIds = prev.tagIds;
        const newIds = currentIds.includes(tagId)
          ? currentIds.filter((id) => id !== tagId)
          : [...currentIds, tagId];

        return { ...prev, tagIds: newIds };
      });
    },
    [],
  );

  const handleCreateTag = useCallback(async () => {
    const trimmedName = newTagName.trim();
    if (!trimmedName) {
      toast.error('Введите название тега');
      return;
    }

    setIsCreatingTag(true);
    try {
      const newTag = await createUniversityEventTag(trimmedName);
      setTags((prev) => [...prev, newTag]);
      setFormState((prev) => {
        if (!prev) {
          return null;
        }
        return {
          ...prev,
          tagIds: [...prev.tagIds, newTag.id],
        };
      });
      setNewTagName('');
      toast.success('Тег создан');
    } catch (error: unknown) {
      console.error('[admin-events] failed to create tag', error);
      toast.error('Не удалось создать тег');
    } finally {
      setIsCreatingTag(false);
    }
  }, [newTagName]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!formState || !eventId) {
        return;
      }

      setFormError(null);
      setIsSubmitting(true);

      try {
        const startDateTime = toIsoString(formState.startDateTime);
        const endDateTime = toIsoString(formState.endDateTime);

        if (!startDateTime || !endDateTime) {
          setFormError('Укажите корректные даты начала и окончания');
          setIsSubmitting(false);
          return;
        }

        if (new Date(startDateTime) >= new Date(endDateTime)) {
          setFormError('Дата окончания должна быть позже даты начала');
          setIsSubmitting(false);
          return;
        }

        const selectedTags = tags.filter((tag) => formState.tagIds.includes(tag.id));

        await updateUniversityEvent(Number.parseInt(eventId, 10), {
          title: formState.title.trim(),
          description: formState.description.trim(),
          location: formState.location.trim(),
          participantsLimit: formState.participantsLimit ? Number.parseInt(formState.participantsLimit, 10) : null,
          startDateTime,
          endDateTime,
          tags: selectedTags,
        });

        toast.success('Событие обновлено');
        navigate('/events');
      } catch (submitError: unknown) {
        console.error('[admin-events] failed to update event', submitError);
        setFormError('Не удалось обновить событие. Проверьте данные и попробуйте снова.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, eventId, navigate, tags],
  );

  if (isLoading) {
    return (
      <PageShell title="Редактирование события" description="Загрузка данных события...">
        <Card className="bg-card/60 backdrop-blur">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Spinner size={32} />
              <p className="text-sm text-muted-foreground">Загрузка события...</p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (loadError || !formState) {
    return (
      <PageShell title="Редактирование события" description="Ошибка загрузки события">
        <Card className="bg-card/60 backdrop-blur">
          <CardContent className="py-12">
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
              {loadError ?? 'Событие не найдено'}
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigate('/events');
              }}
            >
              Вернуться к списку
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Редактирование события"
      description="Измените данные мероприятия и сохраните изменения."
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Редактирование
          </Badge>
          <CardTitle>Редактирование события</CardTitle>
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
                <label htmlFor="title">
                  Название <span className="text-destructive">*</span>
                </label>
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
                Описание <span className="text-destructive">*</span>
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
                <label className="text-sm text-muted-foreground">
                  Дата начала <span className="text-destructive">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="startDateTime"
                  value={formState.startDateTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Дата окончания <span className="text-destructive">*</span>
                </label>
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
                  Место проведения <span className="text-destructive">*</span>
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
                    Пока нет тегов. Создайте новый тег или они будут созданы автоматически при добавлении событий.
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
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Название нового тега"
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleCreateTag();
                    }
                  }}
                  disabled={isCreatingTag}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateTag}
                  isLoading={isCreatingTag}
                  disabled={!newTagName.trim() || isCreatingTag}
                >
                  <span className="inline-flex items-center gap-2">
                    <PlusIcon size={16} />
                    Создать тег
                  </span>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                className="flex-1"
                title={
                  !isFormValid && validationErrors.length > 0
                    ? `Для сохранения необходимо заполнить:\n${validationErrors.join('\n')}`
                    : undefined
                }
              >
                  Сохранить изменения
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/events')}
                  disabled={isSubmitting}
                >
                  Отменить
                </Button>
              </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}

