/* eslint-env browser */
/// <reference lib="dom" />
import type { ReactElement } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PlusIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  createUniversityEvent,
  createUniversityEventTag,
  fetchUniversityEventTags,
  type EventTag,
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

function createDefaultFormState(): EventFormState {
  const start = createDefaultStartDate();

  return {
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

export function CreateEventPage(): ReactElement {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<EventFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<EventTag>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const selectedTagsSet = useMemo(() => new Set(formState.tagIds), [formState.tagIds]);

  const validationErrors = useMemo(() => {
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

  const isFormValid = validationErrors.length === 0;

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

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target as { name: string; value: string };
      const { name, value } = target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      setFormError(null);
    },
    [],
  );

  const handleTagToggle = useCallback(
    (tagId: string) => {
      setFormState((prev) => {
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
      setFormState((prev) => ({
        ...prev,
        tagIds: [...prev.tagIds, newTag.id],
      }));
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

        await createUniversityEvent({
          title: formState.title.trim(),
          description: formState.description.trim(),
          location: formState.location.trim(),
          participantsLimit: formState.participantsLimit ? Number.parseInt(formState.participantsLimit, 10) : null,
          startDateTime,
          endDateTime,
          tags: selectedTags,
        });

        toast.success('Событие создано');
        navigate('/events');
      } catch (submitError: unknown) {
        console.error('[admin-events] failed to create event', submitError);
        setFormError('Не удалось создать событие. Проверьте данные и попробуйте снова.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, navigate, tags],
  );

  return (
    <PageShell
      title="Создание события"
      description="Заполните форму, чтобы добавить новое мероприятие в расписание университета."
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Новая запись
          </Badge>
          <CardTitle>Новое событие</CardTitle>
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
                  <span className="inline-flex items-center gap-2">
                    <PlusIcon size={16} />
                    Создать событие
                  </span>
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

