import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { CloseIcon, EditIcon, PlusIcon, RefreshIcon, TrashIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';
import {
  booksApiService,
  fetchBookReservations,
  type BookDto,
  type BookReservation,
  type LibraryTagDto,
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
  Spinner,
} from '../../../shared/ui/index.ts';

export function BooksListPage(): ReactElement {
  const navigate = useNavigate();
  const [books, setBooks] = useState<ReadonlyArray<BookDto>>([]);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [isBooksRefreshing, setIsBooksRefreshing] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<LibraryTagDto>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);

  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [viewingReservationsBookId, setViewingReservationsBookId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<ReadonlyArray<BookReservation>>([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<ReadonlyArray<string>>([]);

  const filteredTagIdsSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

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

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleFilterTagToggle = useCallback(
    (tagId: string) => {
      setSelectedTagIds((prev) => {
        if (prev.includes(tagId)) {
          return prev.filter((id) => id !== tagId);
        }
        return [...prev, tagId];
      });
    },
    [],
  );

  const handleViewReservations = useCallback(async (bookId: number) => {
    setViewingReservationsBookId(bookId);
    setReservationsError(null);
    setIsReservationsLoading(true);

    try {
      const result = await fetchBookReservations(bookId);
      setReservations(result);
    } catch (error: unknown) {
      console.error('[admin-library] failed to load reservations', error);
      setReservationsError('Не удалось загрузить список резерваций');
      toast.error('Не удалось загрузить список резерваций');
    } finally {
      setIsReservationsLoading(false);
    }
  }, []);

  const handleCloseReservationsModal = useCallback(() => {
    setViewingReservationsBookId(null);
    setReservations([]);
    setReservationsError(null);
  }, []);

  function formatReservationDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getUserDisplayName(reservation: BookReservation): string {
    const parts: Array<string> = [];
    if (reservation.ownerFirstName) parts.push(reservation.ownerFirstName);
    if (reservation.ownerLastName) parts.push(reservation.ownerLastName);
    if (parts.length === 0 && reservation.ownerUsername) return `@${reservation.ownerUsername}`;
    if (parts.length === 0) return 'Неизвестный пользователь';
    return parts.join(' ');
  }

  function isReservationOverdue(reservation: BookReservation): boolean {
    const endDate = new Date(reservation.endReservationDate);
    return endDate < new Date();
  }

  const booksCount = books.length;

  return (
    <PageShell
      title="Управление библиотекой"
      description="Просматривайте, фильтруйте и управляйте книгами каталога."
      actions={
        <>
          <Button onClick={() => navigate('/library/create')} variant="default">
            <span className="inline-flex items-center gap-2">
              <PlusIcon size={16} />
              Создать книгу
            </span>
          </Button>
          <Button onClick={handleRefresh} variant="secondary" isLoading={isBooksRefreshing || isTagsLoading}>
            <span className="inline-flex items-center gap-2">
              <RefreshIcon size={16} />
              Обновить
            </span>
          </Button>
        </>
      }
    >
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
                  <h3 className="text-lg font-semibold text-foreground">{book.title || 'Без названия'}</h3>
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
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleViewReservations(book.id)}
                    disabled={deletingBookId !== null}
                  >
                    Резервации ({book.take_count})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/library/${book.id}/edit`)}
                    disabled={deletingBookId !== null}
                  >
                    <span className="inline-flex items-center gap-2">
                      <EditIcon size={16} />
                      Редактировать
                    </span>
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBook(book.id)}
                    isLoading={deletingBookId === book.id}
                    disabled={deletingBookId !== null && deletingBookId !== book.id}
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

      {viewingReservationsBookId !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseReservationsModal}
        >
          <Card
            className="w-full max-w-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Резервации книги</CardTitle>
                <CardDescription>
                  Всего зарезервировано: {reservations.length}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseReservationsModal}
                aria-label="Закрыть"
              >
                <CloseIcon size={20} />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[60vh] space-y-4 overflow-y-auto">
              {reservationsError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                  {reservationsError}
                </div>
              ) : null}

              {isReservationsLoading ? (
                <div className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 text-sm text-muted-foreground">
                  <Spinner size={20} />
                  Загружаем резервации...
                </div>
              ) : null}

              {!isReservationsLoading && reservations.length === 0 && !reservationsError ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Эта книга пока никому не зарезервирована.
                  </p>
                </div>
              ) : null}

              {!isReservationsLoading && reservations.length > 0 ? (
                <div className="space-y-3">
                  {reservations.map((reservation, index) => {
                    const isOverdue = isReservationOverdue(reservation);
                    return (
                      <div
                        key={`${reservation.bookId}-${reservation.reservationOwnerId}-${index}`}
                        className={cn(
                          'rounded-xl border p-4',
                          isOverdue
                            ? 'border-destructive/70 bg-destructive/10'
                            : 'border-border/70 bg-card/40',
                        )}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {getUserDisplayName(reservation)}
                            </h4>
                            <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {reservation.ownerUsername ? (
                                <span>@{reservation.ownerUsername}</span>
                              ) : null}
                              {reservation.ownerEmail ? (
                                <span>{reservation.ownerEmail}</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div
                              className={cn(
                                'text-sm font-medium',
                                isOverdue ? 'text-destructive' : 'text-foreground',
                              )}
                            >
                              Вернуть до: {formatReservationDate(reservation.endReservationDate)}
                            </div>
                            {isOverdue ? (
                              <Badge variant="destructive" className="text-xs">
                                Просрочено
                              </Badge>
                            ) : null}
                            {reservation.countExtendReservation > 0 ? (
                              <div className="text-xs text-muted-foreground">
                                Продлено {reservation.countExtendReservation} раз(а)
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}

