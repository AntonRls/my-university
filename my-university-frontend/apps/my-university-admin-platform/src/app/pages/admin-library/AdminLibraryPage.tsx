/* eslint-env browser */
/// <reference lib="dom" />
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PlusIcon, RefreshIcon, TrashIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  type BookDto,
  booksApiService,
  type CreateBookParams,
  type LibraryTagDto,
} from '@api/services/books-api-service';

import { PageShell } from '../../../shared/layout';
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

export function AdminLibraryPage(): ReactElement {
  const [formState, setFormState] = useState<BookFormState>(EMPTY_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [books, setBooks] = useState<ReadonlyArray<BookDto>>([]);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [isBooksRefreshing, setIsBooksRefreshing] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<LibraryTagDto>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<ReadonlyArray<string>>([]);

  const selectedTagsSet = useMemo(() => new Set(formState.tagIds), [formState.tagIds]);
  const filteredTagIdsSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

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

  const loadBooks = useCallback(
    async (options?: { silent?: boolean }) => {
      const isSilent = options?.silent === true;

      if (isSilent) {
        setIsBooksRefreshing(true);
      } else {
        setIsBooksLoading(true);
      }

      setBooksError(null);

      try {
        let result: ReadonlyArray<BookDto>;

        if (searchQuery.trim().length > 0) {
          const searchResult = await booksApiService.searchBooks({
            query: searchQuery.trim(),
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
            page: 1,
            pageSize: 100,
          });
          result = searchResult.books;
        } else {
          result = await booksApiService.getBooks({
            tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          });
        }

        setBooks(result);
      } catch (error: unknown) {
        console.error('[admin-library] failed to load books', error);
        setBooksError('Не удалось загрузить список книг');
      } finally {
        if (isSilent) {
          setIsBooksRefreshing(false);
        } else {
          setIsBooksLoading(false);
        }
      }
    },
    [searchQuery, selectedTagIds],
  );

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

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

  const handleFilterTagToggle = useCallback((tagId: string) => {
    setSelectedTagIds((previous) => {
      const hasTag = previous.includes(tagId);

      if (hasTag) {
        return previous.filter((id) => id !== tagId);
      }

      return [...previous, tagId];
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormError(null);
    setFormState(EMPTY_FORM_STATE);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedTitle = formState.title.trim();
      const trimmedDescription = formState.description.trim();
      const trimmedAuthor = formState.author.trim();

      if (!trimmedTitle) {
        setFormError('Введите название книги.');
        return;
      }

      const countValue = formState.count.trim();
      let normalizedCount: number | null = null;

      if (countValue.length > 0) {
        const parsed = Number(countValue);

        if (Number.isNaN(parsed) || !Number.isFinite(parsed) || parsed < 0) {
          setFormError('Количество экземпляров должно быть неотрицательным числом.');
          return;
        }

        normalizedCount = Math.round(parsed);
      } else {
        setFormError('Укажите количество экземпляров.');
        return;
      }

      const selectedTags = resolveSelectedTags(formState.tagIds, tags);

      setIsSubmitting(true);
      setFormError(null);

      try {
        const payload: CreateBookParams = {
          title: trimmedTitle,
          description: trimmedDescription || undefined,
          author: trimmedAuthor || undefined,
          count: normalizedCount,
          tags: selectedTags.map((tag) => ({ id: tag.id, name: tag.name })),
        };

        await booksApiService.createBook(payload);
        toast.success('Книга создана');

        resetForm();
        await loadBooks({ silent: true });
        await loadTags();
      } catch (submitError: unknown) {
        console.error('[admin-library] failed to submit form', submitError);
        toast.error('Не удалось сохранить книгу');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, loadBooks, loadTags, resetForm, tags],
  );

  const handleDeleteBook = useCallback(
    async (bookId: number) => {
      // eslint-disable-next-line no-alert
      const confirmDelete = window.confirm('Удалить книгу? Действие нельзя отменить.');

      if (!confirmDelete) {
        return;
      }

      setDeletingBookId(bookId);

      try {
        await booksApiService.deleteBook({ bookId });
        toast.success('Книга удалена');

        await loadBooks({ silent: true });
      } catch (deleteError: unknown) {
        console.error('[admin-library] failed to delete book', deleteError);
        toast.error('Не удалось удалить книгу');
      } finally {
        setDeletingBookId(null);
      }
    },
    [loadBooks],
  );

  const handleRefresh = useCallback(() => {
    void loadBooks({ silent: true });
    void loadTags();
  }, [loadBooks, loadTags]);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const booksCount = books.length;

  return (
    <PageShell
      title="Управление библиотекой"
      description="Добавляйте, фильтруйте и удаляйте книги каталога."
      actions={
        <Button
          onClick={handleRefresh}
          variant="secondary"
          isLoading={isBooksRefreshing || isTagsLoading}
        >
          <span className="inline-flex items-center gap-2">
            <RefreshIcon size={16} />
            Обновить
          </span>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle>Новая книга</CardTitle>
            <CardDescription>
              Добавьте название, описание, автора и количество экземпляров. Теги помогают быстро
              находить книги.
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
                      Пока нет тегов. Они будут созданы автоматически при добавлении книг.
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
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                className="w-full"
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
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur">
          <CardHeader className="gap-1">
            <CardTitle>Список книг</CardTitle>
            <CardDescription>
              {booksCount === 0 ? 'Нет книг' : `${booksCount} в каталоге`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Поиск по названию, автору, описанию..."
              autoComplete="off"
            />

            {tags.length > 0 ? (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Фильтр по тегам:</span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = filteredTagIdsSet.has(tag.id);

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary/60',
                        )}
                        onClick={() => handleFilterTagToggle(tag.id)}
                        aria-pressed={isSelected}
                      >
                        #{tag.name || 'Без названия'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {booksError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {booksError}
                <Button
                  variant="ghost"
                  className="mt-2 px-0 text-destructive-foreground underline"
                  onClick={() => {
                    void loadBooks();
                  }}
                >
                  Повторить попытку
                </Button>
              </div>
            ) : null}

            {isBooksLoading ? (
              <div className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
                Загружаем книги...
              </div>
            ) : null}

            {!isBooksLoading && books.length === 0 && !booksError ? (
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                Книг пока нет. Добавьте новую книгу, чтобы студенты видели её в каталоге.
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {books.map((book) => (
                <article
                  key={book.id}
                  className="rounded-2xl border border-border/70 bg-card/40 px-4 py-3 shadow-md shadow-black/10"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      {book.title || 'Без названия'}
                    </h3>
                    {book.author ? (
                      <span className="text-sm text-muted-foreground">{book.author}</span>
                    ) : null}
                  </div>
                  {book.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{book.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Доступно: {book.count - book.take_count} из {book.count}
                  </p>
                  {book.tags && book.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {book.tags.map((tag: LibraryTagDto) => (
                        <Badge key={tag.id} variant="outline">
                          #{tag.name || 'Без названия'}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Теги не назначены</p>
                  )}
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteBook(book.id)}
                      isLoading={deletingBookId === book.id}
                      disabled={
                        isSubmitting || (deletingBookId !== null && deletingBookId !== book.id)
                      }
                      aria-label={`Удалить книгу ${book.title || 'Без названия'}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <TrashIcon size={16} />
                        Удалить
                      </span>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function resolveSelectedTags(
  tagIds: ReadonlyArray<string>,
  allTags: ReadonlyArray<LibraryTagDto>,
): ReadonlyArray<LibraryTagDto> {
  const tagsMap = new Map(allTags.map((tag) => [tag.id, tag]));

  return tagIds
    .map((tagId) => tagsMap.get(tagId))
    .filter((tag): tag is LibraryTagDto => Boolean(tag));
}
