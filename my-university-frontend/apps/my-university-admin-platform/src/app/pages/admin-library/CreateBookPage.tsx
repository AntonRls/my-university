import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { PlusIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  booksApiService,
  type LibraryTagDto,
  type CreateBookParams,
} from '@api/services/books-api-service';

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

type BookFormState = {
  title: string;
  description: string;
  author: string;
  count: string;
  tagIds: ReadonlyArray<string>;
};

const EMPTY_FORM_STATE: BookFormState = {
  title: '',
  description: '',
  author: '',
  count: '',
  tagIds: [],
};

export function CreateBookPage(): ReactElement {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<BookFormState>(EMPTY_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<LibraryTagDto>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const selectedTagsSet = useMemo(() => new Set(formState.tagIds), [formState.tagIds]);

  const validationErrors = useMemo(() => {
    const errors: Array<string> = [];

    if (!formState.title.trim()) {
      errors.push('Название книги обязательно');
    }

    if (!formState.count.trim() || Number.parseInt(formState.count, 10) <= 0) {
      errors.push('Количество экземпляров должно быть больше 0');
    }

    return errors;
  }, [formState]);

  const isFormValid = validationErrors.length === 0;

  const loadTags = useCallback(async () => {
    setIsTagsLoading(true);

    try {
      const result = await booksApiService.getTags();
      setTags(result);
    } catch (error: unknown) {
      console.error('[admin-library] failed to load tags', error);
      toast.error('Не удалось загрузить теги книг');
      setTags([]);
    } finally {
      setIsTagsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

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
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
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
      const newTag = await booksApiService.createTag({ name: trimmedName });
      setTags((prev) => [...prev, newTag]);
      setFormState((prev) => ({
        ...prev,
        tagIds: [...prev.tagIds, newTag.id],
      }));
      setNewTagName('');
      toast.success('Тег создан');
    } catch (error: unknown) {
      console.error('[admin-library] failed to create tag', error);
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
        const trimmedTitle = formState.title.trim();
        const trimmedDescription = formState.description.trim();
        const trimmedAuthor = formState.author.trim();

        if (!trimmedTitle) {
          setFormError('Название книги обязательно');
          setIsSubmitting(false);
          return;
        }

        const normalizedCount = Number.parseInt(formState.count, 10);

        if (Number.isNaN(normalizedCount) || normalizedCount <= 0) {
          setFormError('Количество экземпляров должно быть положительным числом');
          setIsSubmitting(false);
          return;
        }

        const selectedTags = tags.filter((tag) => formState.tagIds.includes(tag.id));

        const payload: CreateBookParams = {
          title: trimmedTitle,
          description: trimmedDescription || undefined,
          author: trimmedAuthor || undefined,
          count: normalizedCount,
          tags: selectedTags.map((tag) => ({ id: tag.id, name: tag.name })),
        };

        await booksApiService.createBook(payload);
        toast.success('Книга создана');
        navigate('/library');
      } catch (submitError: unknown) {
        console.error('[admin-library] failed to submit form', submitError);
        setFormError('Не удалось сохранить книгу');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, navigate, tags],
  );

  return (
    <PageShell
      title="Создание книги"
      description="Заполните форму, чтобы добавить новую книгу в каталог библиотеки."
    >
      <Card className="bg-card/60 backdrop-blur">
        <CardHeader className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Новая запись
          </Badge>
          <CardTitle>Новая книга</CardTitle>
          <CardDescription>
            Добавьте название, описание, автора и количество экземпляров. Теги помогают быстро находить книги.
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
              <label htmlFor="title" className="text-sm text-muted-foreground">
                Название <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                value={formState.title}
                onChange={handleInputChange}
                placeholder="Например, Введение в алгоритмы"
                maxLength={200}
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="author" className="text-sm text-muted-foreground">
                  Автор (необязательно)
                </label>
                <Input
                  id="author"
                  name="author"
                  value={formState.author}
                  onChange={handleInputChange}
                  placeholder="Например, Томас Кормен"
                  maxLength={200}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="count" className="text-sm text-muted-foreground">
                  Количество экземпляров <span className="text-destructive">*</span>
                </label>
                <Input
                  id="count"
                  name="count"
                  type="number"
                  value={formState.count}
                  onChange={handleInputChange}
                  placeholder="Например, 10"
                  min="0"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm text-muted-foreground">
                Описание (необязательно)
              </label>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleInputChange}
                placeholder="Краткое описание книги"
                maxLength={2000}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Теги</span>
                <span>{isTagsLoading ? 'Загрузка...' : `${tags.length} доступно`}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Пока нет тегов. Создайте новый тег или они будут созданы автоматически при добавлении книг.
                  </p>
                ) : null}
                {tags.map((tag) => {
                  const isSelected = selectedTagsSet.has(tag.id);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={cn(
                        'rounded-full border px-4 py-1 text-xs font-medium transition',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/60',
                      )}
                      onClick={() => handleTagToggle(tag.id)}
                      aria-pressed={isSelected}
                    >
                      #{tag.name || 'Без названия'}
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
                    Создать книгу
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/library')}
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

