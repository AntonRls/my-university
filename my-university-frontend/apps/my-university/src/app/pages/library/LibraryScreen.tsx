/// <reference lib="dom" />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconButton, Spinner } from '@maxhub/max-ui';
import { toast } from 'sonner';

import { PageTemplate } from '@shared/ui/page-template';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { MuSearchInput } from '@shared/ui/input';
import { ErrorState } from '@shared/ui/error-state';
import { OrderedBooksIcon, FavoriteBooksIcon, BookIcon, SearchIcon } from '@shared/icons';
import { Info } from 'lucide-react';
import { cn } from '@shared/utils/className';
import { ROUTES } from '@shared/config/routes';
import {
  BookCard,
  BookDetailsSheet,
  fetchBookTags,
  fetchBooks,
  fetchStudentReservations,
  searchBooks,
  extendReservation,
} from '@entities/book';
import type { Book } from '@entities/book';
import type { BookDto, LibraryTagDto } from '@api/services/books-api-service';
import { ApiError } from '@api/shared/api/api-client';
import type { ReservationDto } from '@api/services/reservations-api-service';

import styles from './LibraryScreen.module.scss';

const RESERVATION_DATE_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const REMOTE_PAGE_SIZE = 20;

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

function getTagDisplayName(tag: LibraryTagDto): string {
  return tag.name?.trim() ?? 'Без названия';
}

function formatReservationDate(value?: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return RESERVATION_DATE_FORMATTER.format(date);
}

function getDaysUntilDate(value?: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

function getDaysWord(days: number): string {
  const absDays = Math.abs(days);
  const lastDigit = absDays % 10;
  const lastTwoDigits = absDays % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }

  if (lastDigit === 1) {
    return 'день';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }

  return 'дней';
}

function mapBookDtoToBook(
  dto: BookDto,
  reservationsMap: Map<number, ReservationDto>,
): Book {
  const reservation = reservationsMap.get(dto.id);
  const tagNames = dto.tags
    ?.map((tag) => tag.name?.trim())
    .filter((name): name is string => Boolean(name && name.length > 0)) ?? [];

  const authorCandidate = dto.author?.trim();

  return {
    id: String(dto.id),
    title: dto.title?.trim() ?? 'Без названия',
    description: dto.description?.trim() ?? 'Описание отсутствует',
    author: authorCandidate ?? 'Автор не указан',
    tags: tagNames,
    availableCount: Math.max(0, dto.count - dto.take_count),
    isFavorite: dto.is_favorite,
    isReserved: Boolean(reservation),
    reservationEndDate: reservation?.end_reservation_date,
  };
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function pickRandomSubset<T>(items: ReadonlyArray<T>, maxCount: number): ReadonlyArray<T> {
  if (maxCount <= 0) {
    return [];
  }

  if (items.length <= maxCount) {
    return items;
  }

  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = pool[index];
    pool[index] = pool[randomIndex];
    pool[randomIndex] = currentItem;
  }

  return pool.slice(0, maxCount);
}

function getFieldScore(source: string, token: string, baseWeight: number): number {
  if (source.length === 0) {
    return 0;
  }

  const matchIndex = source.indexOf(token);

  if (matchIndex === -1) {
    return 0;
  }

  let score = baseWeight;

  if (matchIndex === 0) {
    score += baseWeight * 0.5;
  } else {
    const charBefore = source[matchIndex - 1];
    if (charBefore === ' ' || charBefore === '\n' || charBefore === '\t' || charBefore === '-') {
      score += baseWeight * 0.3;
    }
  }

  const charAfter = source.charAt(matchIndex + token.length);

  if (charAfter === '' || charAfter === ' ' || charAfter === '\n' || charAfter === '\t' || charAfter === '-' || charAfter === ',') {
    score += baseWeight * 0.2;
  }

  if (source === token) {
    score += baseWeight * 0.5;
  }

  return score;
}

function getBookMatchScore(book: Book, tokens: ReadonlyArray<string>): number | null {
  if (tokens.length === 0) {
    return 0;
  }

  const normalizedTitle = normalizeText(book.title);
  const normalizedAuthor = normalizeText(book.author);
  const normalizedDescription = normalizeText(book.description);
  const normalizedTags = book.tags.map((tag) => normalizeText(tag)).join(' ');

  let totalScore = 0;

  for (const token of tokens) {
    let tokenScore = 0;

    tokenScore = Math.max(tokenScore, getFieldScore(normalizedTitle, token, 4));
    tokenScore = Math.max(tokenScore, getFieldScore(normalizedAuthor, token, 3));
    tokenScore = Math.max(tokenScore, getFieldScore(normalizedTags, token, 2));
    tokenScore = Math.max(tokenScore, getFieldScore(normalizedDescription, token, 1));

    if (tokenScore === 0) {
      return null;
    }

    totalScore += tokenScore;
  }

  if (book.isFavorite) {
    totalScore += 0.2;
  }

  return totalScore;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function LibraryScreen() {
  const { id: bookIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const trimmedSearchValue = searchQuery.trim();
  const debouncedSearchQuery = useDebouncedValue(trimmedSearchValue, 300);
  const [isRemoteSearchEnabled, setIsRemoteSearchEnabled] = useState(true);
  const [remoteBookDtos, setRemoteBookDtos] = useState<ReadonlyArray<BookDto>>([]);
  const [remotePageSize, setRemotePageSize] = useState(20);
  const [remotePage, setRemotePage] = useState(0);
  const [remoteHasMore, setRemoteHasMore] = useState(false);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const [tags, setTags] = useState<ReadonlyArray<LibraryTagDto>>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<ReadonlyArray<string>>([]);

  const [bookDtos, setBookDtos] = useState<ReadonlyArray<BookDto> | null>(null);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);
  const [hasAttemptedRemoteSearch, setHasAttemptedRemoteSearch] = useState(false);

  const [reservations, setReservations] = useState<ReadonlyArray<ReservationDto>>([]);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  const [isReservationsSheetOpen, setIsReservationsSheetOpen] = useState(false);
  const [extendingReservationId, setExtendingReservationId] = useState<number | null>(null);

  const booksAbortControllerRef = useRef<AbortController | null>(null);
  const reservationsAbortControllerRef = useRef<AbortController | null>(null);
  const remoteSearchAbortControllerRef = useRef<AbortController | null>(null);
  const remoteQueryKeyRef = useRef<string>('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadTags = useCallback(async () => {
    setIsTagsLoading(true);

    try {
      const result = await fetchBookTags();
      const sortedTags = [...result].sort((a, b) => getTagDisplayName(a).localeCompare(getTagDisplayName(b)));
      setTags(sortedTags);
    } catch (error) {
      console.error('[library] failed to load tags', error);
      setTags([]);
    } finally {
      setIsTagsLoading(false);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    reservationsAbortControllerRef.current?.abort();

    const controller = new AbortController();
    reservationsAbortControllerRef.current = controller;

    setIsReservationsLoading(true);
    setReservationsError(null);

    try {
      const result = await fetchStudentReservations(controller.signal);
      setReservations(result);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[library] failed to load reservations', error);
      setReservationsError('Не удалось загрузить бронирования');
    } finally {
      if (reservationsAbortControllerRef.current === controller) {
        reservationsAbortControllerRef.current = null;
      }
      setIsReservationsLoading(false);
    }
  }, []);

  const loadBooks = useCallback(async () => {
    booksAbortControllerRef.current?.abort();

    const controller = new AbortController();
    booksAbortControllerRef.current = controller;

    setIsBooksLoading(true);
    setBooksError(null);

    try {
      const result = await fetchBooks({ tagIds: selectedTagIds, signal: controller.signal });
      setBookDtos(result);
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }

      console.error('[library] failed to load books', error);
      setBooksError('Не удалось загрузить книги');
    } finally {
      if (booksAbortControllerRef.current === controller) {
        booksAbortControllerRef.current = null;
      }
      setIsBooksLoading(false);
    }
  }, [selectedTagIds]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    return () => {
      booksAbortControllerRef.current?.abort();
      reservationsAbortControllerRef.current?.abort();
      remoteSearchAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    setSelectedTagIds((previous) => previous.filter((id) => tags.some((tag) => tag.id === id)));
  }, [tags]);

  useEffect(() => {
    if (bookIdFromUrl) {
      void loadReservations();
      void loadBooks();
    }
  }, [bookIdFromUrl, loadBooks, loadReservations]);

  const reservationsByBookId = useMemo(() => {
    return reservations.reduce<Map<number, ReservationDto>>((map, reservation) => {
      map.set(reservation.book.id, reservation);
      return map;
    }, new Map());
  }, [reservations]);

  const normalizedSearchValue = useMemo(() => normalizeText(trimmedSearchValue), [trimmedSearchValue]);

  const searchTokens = useMemo<ReadonlyArray<string>>(() => {
    if (normalizedSearchValue.length === 0) {
      return [];
    }

    return normalizedSearchValue.split(/\s+/).filter(Boolean);
  }, [normalizedSearchValue]);

  const fallbackAllBooks = useMemo<ReadonlyArray<Book>>(() => {
    if (!bookDtos) {
      return [];
    }

    return bookDtos.map((dto) => mapBookDtoToBook(dto, reservationsByBookId));
  }, [bookDtos, reservationsByBookId]);

  const fallbackBooks = useMemo<ReadonlyArray<Book>>(() => {
    if (searchTokens.length === 0 && !showOnlyFavorites) {
      return fallbackAllBooks;
    }

    const filteredByFavorites = showOnlyFavorites
      ? fallbackAllBooks.filter((book) => book.isFavorite)
      : fallbackAllBooks;

    if (searchTokens.length === 0) {
      return filteredByFavorites;
    }

    const scoredBooks = filteredByFavorites
      .map((book) => {
        const score = getBookMatchScore(book, searchTokens);
        if (score === null) {
          return null;
        }

        return { book, score };
      })
      .filter((entry): entry is { book: Book; score: number } => entry !== null)
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return first.book.title.localeCompare(second.book.title, 'ru-RU');
      })
      .map((entry) => entry.book);

    return scoredBooks;
  }, [fallbackAllBooks, searchTokens, showOnlyFavorites]);

  const hasLoadedBooks = bookDtos !== null;

  const remoteBooks = useMemo<ReadonlyArray<Book>>(() => {
    if (remoteBookDtos.length === 0) {
      return [];
    }

    const mapped = remoteBookDtos.map((dto) => mapBookDtoToBook(dto, reservationsByBookId));

    if (!showOnlyFavorites) {
      return mapped;
    }

    return mapped.filter((book) => book.isFavorite);
  }, [remoteBookDtos, reservationsByBookId, showOnlyFavorites]);

  const sortedSelectedTagIds = useMemo(() => [...selectedTagIds].sort(), [selectedTagIds]);

  const remoteQueryKey = useMemo(() => {
    return JSON.stringify({
      query: debouncedSearchQuery,
      tags: sortedSelectedTagIds,
    });
  }, [debouncedSearchQuery, sortedSelectedTagIds]);

  const shouldShowRemoteResults =
    isRemoteSearchEnabled && remoteError === null && debouncedSearchQuery.length >= 1;

  const isFallbackActive = !isRemoteSearchEnabled || remoteError !== null || debouncedSearchQuery.length === 0;

  const displayedBooks = shouldShowRemoteResults ? remoteBooks : fallbackBooks;

  const shouldShowRemoteResultsList = shouldShowRemoteResults && hasAttemptedRemoteSearch;
  const shouldShowFallbackResults = isFallbackActive && hasLoadedBooks;
  const shouldShowResultsList = shouldShowRemoteResultsList || shouldShowFallbackResults;

  const combinedBooks = useMemo<ReadonlyArray<Book>>(() => {
    if (!shouldShowRemoteResults) {
      return fallbackAllBooks;
    }

    const merged = new Map<string, Book>();

    fallbackAllBooks.forEach((book) => merged.set(book.id, book));
    remoteBooks.forEach((book) => merged.set(book.id, book));

    return Array.from(merged.values());
  }, [fallbackAllBooks, remoteBooks, shouldShowRemoteResults]);

  const runRemoteSearch = useCallback(
    async (page: number, append: boolean, queryKey: string) => {
      if (!isRemoteSearchEnabled) {
        return;
      }

      const controller = new AbortController();
      remoteSearchAbortControllerRef.current?.abort();
      remoteSearchAbortControllerRef.current = controller;

      setHasAttemptedRemoteSearch(true);
      setIsRemoteLoading(true);

      try {
        const response = await searchBooks({
          query: debouncedSearchQuery,
          tagIds: selectedTagIds,
          page,
          pageSize: remotePageSize || REMOTE_PAGE_SIZE,
          signal: controller.signal,
        });

        if (remoteQueryKeyRef.current !== queryKey) {
          return;
        }

        setRemoteBookDtos((previous) =>
          append ? [...previous, ...response.books] : response.books,
        );
        setRemotePage(response.page);
        setRemotePageSize(response.page_size);
        setRemoteHasMore(response.page * response.page_size < response.total);
        setRemoteError(null);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        console.error('[library] remote search failed', error);

        let message =
          'Удалённый поиск временно недоступен. Показаны результаты локального поиска.';

        if (error instanceof ApiError) {
          if (error.status === 503) {
            message = 'Поиск временно недоступен. Показаны результаты локального поиска.';
          } else {
            message = `Ошибка поиска (код ${error.status}). Показаны результаты локального поиска.`;
          }
        }

        setRemoteError(message);
        setIsRemoteSearchEnabled(false);
      } finally {
        if (remoteSearchAbortControllerRef.current === controller) {
          remoteSearchAbortControllerRef.current = null;
        }

        if (remoteQueryKeyRef.current === queryKey) {
          setIsRemoteLoading(false);
        }
      }
    },
    [debouncedSearchQuery, isRemoteSearchEnabled, remotePageSize, selectedTagIds],
  );

  useEffect(() => {
    if (!shouldShowRemoteResults || !remoteHasMore) {
      return;
    }

    const target = loadMoreRef.current;

    if (!target || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;

      if (!entry?.isIntersecting) {
        return;
      }

      if (isRemoteLoading) {
        return;
      }

      const nextPage = remotePage + 1;
      const queryKey = remoteQueryKeyRef.current;

      void runRemoteSearch(nextPage, true, queryKey);
    }, { rootMargin: '200px 0px' });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isRemoteLoading, remoteHasMore, remotePage, runRemoteSearch, shouldShowRemoteResults]);

  useEffect(() => {
    if (!isRemoteSearchEnabled) {
      remoteSearchAbortControllerRef.current?.abort();
      remoteSearchAbortControllerRef.current = null;
      remoteQueryKeyRef.current = '';
      setRemoteBookDtos([]);
      setRemotePage(0);
      setRemoteHasMore(false);
      setIsRemoteLoading(false);
      setHasAttemptedRemoteSearch(false);
      return;
    }

    if (debouncedSearchQuery.length === 0) {
      remoteSearchAbortControllerRef.current?.abort();
      remoteSearchAbortControllerRef.current = null;
      remoteQueryKeyRef.current = '';
      setRemoteBookDtos([]);
      setRemotePage(0);
      setRemoteHasMore(false);
      setIsRemoteLoading(false);
      setHasAttemptedRemoteSearch(false);
      return;
    }

    const queryKey = remoteQueryKey;
    remoteQueryKeyRef.current = queryKey;
    setRemoteBookDtos([]);
    setRemotePage(0);
    setRemoteHasMore(false);
    setRemoteError(null);

    void runRemoteSearch(1, false, queryKey);

    return () => {
      remoteSearchAbortControllerRef.current?.abort();
      remoteSearchAbortControllerRef.current = null;
    };
  }, [debouncedSearchQuery, isRemoteSearchEnabled, remoteQueryKey, runRemoteSearch]);

  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTagIds((previous) => {
      if (previous.includes(tagId)) {
        return previous.filter((id) => id !== tagId);
      }

      return [...previous, tagId];
    });
  }, []);

  const handleBookFavoriteChange = useCallback((bookId: string, isFavorite: boolean) => {
    setBookDtos((previous) => {
      if (!previous) {
        return previous;
      }

      return previous.map((dto) => (String(dto.id) === bookId ? { ...dto, is_favorite: isFavorite } : dto));
    });
    setRemoteBookDtos((previous) =>
      previous.map((dto) => (String(dto.id) === bookId ? { ...dto, is_favorite: isFavorite } : dto)),
    );
  }, []);

  const handleBookReservationChange = useCallback(
    (bookId: string, isReserved: boolean) => {
      setBookDtos((previous) => {
        if (!previous) {
          return previous;
        }

        return previous.map((dto) =>
          String(dto.id) === bookId
            ? { ...dto, take_count: isReserved ? dto.take_count + 1 : Math.max(dto.take_count - 1, 0) }
            : dto,
        );
      });
      setRemoteBookDtos((previous) =>
        previous.map((dto) =>
          String(dto.id) === bookId
            ? { ...dto, take_count: isReserved ? dto.take_count + 1 : Math.max(dto.take_count - 1, 0) }
            : dto,
        ),
      );

      if (!isReserved) {
        setReservations((previous) =>
          previous.filter((reservation) => String(reservation.book.id) !== bookId),
        );
      }

      void loadReservations();
      void loadBooks();
    },
    [loadBooks, loadReservations],
  );

  const handleBookReservationRefresh = useCallback(() => {
      void loadReservations();
      void loadBooks();
    },
    [loadBooks, loadReservations],
  );

  const handleRetryBooks = useCallback(() => {
    void loadBooks();
  }, [loadBooks]);

  const handleRemoteSearchRetry = useCallback(() => {
    setIsRemoteSearchEnabled(true);
    setRemoteError(null);
    setHasAttemptedRemoteSearch(false);
  }, []);

  const selectedBook = useMemo<Book | null>(() => {
    if (!bookIdFromUrl) {
      return null;
    }

    return combinedBooks.find((book) => book.id === bookIdFromUrl) ?? null;
  }, [bookIdFromUrl, combinedBooks]);

  const isBookNotFound = Boolean(
    bookIdFromUrl &&
      !selectedBook &&
      !isBooksLoading &&
      !isRemoteLoading &&
      ((shouldShowRemoteResults && remoteBookDtos.length > 0) ||
        (!shouldShowRemoteResults && (bookDtos?.length ?? 0) > 0)),
  );

  const isBookDetailsOpen = Boolean(bookIdFromUrl && selectedBook);
  const isNotFoundSheetOpen = isBookNotFound;

  useEffect(() => {
    if (isBookDetailsOpen) {
      void loadReservations();
      void loadBooks();
    }
  }, [isBookDetailsOpen, loadBooks, loadReservations]);

  const handleCloseBookDetails = useCallback(() => {
    navigate(ROUTES.library, { replace: true });
  }, [navigate]);

  const handleSearchOther = useCallback(() => {
    handleCloseBookDetails();
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);
  }, [handleCloseBookDetails]);

  const handleExtendReservation = useCallback(
    async (bookId: number) => {
      setExtendingReservationId(bookId);

      try {
        await extendReservation({ bookId });
        toast.success('Бронирование продлено на 7 дней');
        await loadReservations();
        await loadBooks();
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        console.error('[library] failed to extend reservation', error);
        toast.error('Не удалось продлить бронирование');
      } finally {
        setExtendingReservationId((current) => (current === bookId ? null : current));
      }
    },
    [loadBooks, loadReservations],
  );

  const selectedTagsSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const visibleTags = useMemo<ReadonlyArray<LibraryTagDto>>(() => {
    if (tags.length === 0) {
      return [];
    }

    const selectedTags = tags.filter((tag) => selectedTagsSet.has(tag.id));
    const remainingTags = tags.filter((tag) => !selectedTagsSet.has(tag.id));
    const availableSlots = Math.max(0, 5 - selectedTags.length);
    const randomSubset = pickRandomSubset(remainingTags, availableSlots);

    if (selectedTags.length >= 5) {
      return selectedTags;
    }

    return [...selectedTags, ...randomSubset];
  }, [selectedTagsSet, tags]);

  const reservationsList = useMemo(() => {
    return reservations.map((reservation) => {
      const { book, end_reservation_date: endReservationDate } = reservation;
      
      const endDate = endReservationDate ? new Date(endReservationDate) : null;
      const now = new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      let urgency: 'normal' | 'soon' | 'overdue' = 'normal';
      
      if (endDate && !Number.isNaN(endDate.getTime())) {
        const timeUntilEnd = endDate.getTime() - now.getTime();
        
        if (timeUntilEnd < 0) {
          urgency = 'overdue';
        } else if (timeUntilEnd < threeDaysInMs) {
          urgency = 'soon';
        }
      }
      
      const extendedEndDate =
        endDate && !Number.isNaN(endDate.getTime())
          ? new Date(endDate.getTime() + sevenDaysInMs).toISOString()
          : null;
      
      return {
        id: book.id,
        title: book.title?.trim() ?? 'Без названия',
        description: book.description?.trim() ?? 'Описание отсутствует',
        endDate: endReservationDate,
        extendedEndDate,
        urgency,
      };
    });
  }, [reservations]);

  const handleFavoritesToggle = useCallback(() => {
    setShowOnlyFavorites((previous) => !previous);
  }, []);

  const handleReservationsClick = useCallback(() => {
    setIsReservationsSheetOpen(true);
    void loadReservations();
  }, [loadReservations]);

  const handleRetryReservations = useCallback(() => {
    void loadReservations();
  }, [loadReservations]);

  const isLoading = shouldShowRemoteResultsList
    ? isRemoteLoading
    : isFallbackActive
      ? isBooksLoading
      : false;

  const isEmptyState =
    (shouldShowRemoteResultsList && !isRemoteLoading && remoteBooks.length === 0) ||
    (shouldShowFallbackResults && !isBooksLoading && !booksError && displayedBooks.length === 0);

  return (
    <PageTemplate
      title={['Электронная', 'библиотека']}
      actions={(
        <>
          <IconButton
            type="button"
            size="medium"
            mode="secondary"
            appearance="neutral"
            aria-label={showOnlyFavorites ? 'Показать все книги' : 'Показать избранные книги'}
            aria-pressed={showOnlyFavorites}
            className={cn(styles.actionButton, showOnlyFavorites && styles.actionButtonActive)}
            onClick={handleFavoritesToggle}
          >
            <FavoriteBooksIcon className={styles.actionIcon} />
          </IconButton>
          <IconButton
            type="button"
            size="medium"
            mode="secondary"
            appearance="neutral"
            aria-label="Заказанные книги"
            className={styles.actionButton}
            onClick={handleReservationsClick}
          >
            <OrderedBooksIcon className={styles.actionIcon} />
          </IconButton>
        </>
      )}
    >
      <section className={styles.searchSection}>
        <MuSearchInput
          ref={searchInputRef}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Введите название книги, автора или тему"
          autoComplete="off"
          aria-label="Поиск по библиотеке"
          aria-busy={isLoading}
        />
      </section>

      {visibleTags.length > 0 ? (
      <section className={styles.popularTagsSection}>
        <ul className={styles.tagsList}>
          {visibleTags.map((tag) => {
            const tagName = getTagDisplayName(tag);
            const isSelected = selectedTagsSet.has(tag.id);

            return (
              <li key={tag.id}>
                <button
                  type="button"
                  className={cn(styles.tag, isSelected && styles.tagSelected)}
                  onClick={() => handleTagToggle(tag.id)}
                  aria-label={isSelected ? `Убрать тег ${tagName}` : `Выбрать тег ${tagName}`}
                  aria-pressed={isSelected}
                  disabled={isTagsLoading}
                >
                  #{tagName}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      ) : null}

      <section className={styles.booksSection}>
        {remoteError ? (
          <div className={styles.remoteFallback}>
            <p className={styles.errorMessage}>{remoteError}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={handleRemoteSearchRetry}
            >
              Попробовать снова
            </button>
          </div>
        ) : null}

        {isFallbackActive && booksError ? (
          <ErrorState
            title="Не удалось загрузить книги"
            message="Попробуйте позже, мы уже разбираемся с проблемой."
            onRetry={handleRetryBooks}
          />
        ) : null}

        {isLoading ? (
          <div className={styles.loader} role="status" aria-live="polite">
            <Spinner size={30} className={styles.loaderSpinner} />
          </div>
        ) : null}


        {shouldShowResultsList && isEmptyState && !isLoading ? (
          <ErrorState
            title="Книги не найдены"
            message="Попробуйте изменить условия поиска или выбрать другие теги."
          />
        ) : null}

        {shouldShowResultsList ? (
          <ul className={styles.booksList}>
            {displayedBooks.map((book) => (
              <li
                key={`${book.id}-${book.isFavorite ? 'fav' : 'nofav'}-${book.isReserved ? 'ordered' : 'free'}`}
              >
                <BookCard
                  book={book}
                  onFavoriteChange={handleBookFavoriteChange}
                  onReservationChange={handleBookReservationChange}
                />
              </li>
            ))}
          </ul>
        ) : null}

        {shouldShowRemoteResults && remoteHasMore ? (
          <div ref={loadMoreRef} className={styles.loadMoreTrigger} aria-hidden />
        ) : null}
      </section>

      {selectedBook ? (
        <BookDetailsSheet
          book={selectedBook}
          isOpen={isBookDetailsOpen}
          onClose={handleCloseBookDetails}
          onReservationChange={handleBookReservationChange}
          onFavoriteChange={handleBookFavoriteChange}
          onReservationRefresh={handleBookReservationRefresh}
        />
      ) : null}

      <BottomSheet
        isOpen={isNotFoundSheetOpen}
        onClose={handleCloseBookDetails}
      >
        <div className={styles.notFoundState}>
          <BookIcon className={styles.notFoundIcon} />
          <p className={styles.notFoundMessage}>
            К сожалению не удалось найти книгу в каталоге
          </p>
          <button
            type="button"
            className={styles.searchOtherButton}
            onClick={handleSearchOther}
          >
            <SearchIcon className={styles.searchOtherIcon} />
            Искать другие
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isReservationsSheetOpen}
        onClose={() => setIsReservationsSheetOpen(false)}
        title="Мои бронирования"
      >
        {reservationsError ? (
          <ErrorState
            title="Не удалось загрузить бронирования"
            message="Попробуйте позже, мы уже разбираемся с проблемой."
            onRetry={handleRetryReservations}
          />
        ) : null}

        {isReservationsLoading ? (
          <div className={styles.loader} role="status" aria-live="polite">
            <Spinner size={24} className={styles.loaderSpinner} />
          </div>
        ) : null}

        {!isReservationsLoading && reservationsList.length === 0 && !reservationsError ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateIcon}>📚</span>
            <p className={styles.stateMessage}>У вас нет активных бронирований</p>
          </div>
        ) : null}

        {!isReservationsLoading && reservationsList.length > 0 && !reservationsError ? (
          <div className={styles.infoBox}>
            <Info className={styles.infoIcon} />
            <div className={styles.infoContent}>
              <p className={styles.infoText}>
                Бронь действует 7 дней, затем автоматически отменяется
              </p>
              <p className={styles.infoText}>
                Можно продлить максимум 3 раза
              </p>
            </div>
          </div>
        ) : null}

        <ul className={styles.reservationsList}>
          {reservationsList.map((reservation) => {
            const isProcessing = extendingReservationId === reservation.id;
            const extendedEndDateLabel = reservation.extendedEndDate
              ? formatReservationDate(reservation.extendedEndDate)
              : null;

            return (
              <li 
                key={reservation.id} 
                className={cn(
                  styles.reservationItem,
                  reservation.urgency === 'overdue' && styles.reservationItemOverdue,
                  reservation.urgency === 'soon' && styles.reservationItemSoon,
                )}
              >
                <div className={styles.bookImagePlaceholder}>
                  <BookIcon className={styles.bookImageIcon} />
                </div>

                <div className={styles.reservationContent}>
                  <h3 className={styles.reservationTitle}>{reservation.title}</h3>
                  <p className={styles.reservationDescription}>{reservation.description}</p>
                  
                  <div className={styles.reservationDateInfo}>
                    {(() => {
                      const daysLeft = getDaysUntilDate(reservation.endDate);
                      const dateStr = formatReservationDate(reservation.endDate);
                      
                      if (daysLeft === null) {
                        return (
                          <p className={styles.dateText}>
                            Вернуть до: <span className={styles.dateValue}>{dateStr}</span>
                          </p>
                        );
                      }

                      if (daysLeft < 0) {
                        const overdueDays = Math.abs(daysLeft);
                        return (
                          <>
                            <p className={cn(styles.daysLeft, styles.daysLeftOverdue)}>
                              Просрочено на {overdueDays} {getDaysWord(overdueDays)}
                            </p>
                            <p className={styles.dateText}>
                              Нужно было вернуть: <span className={styles.dateValue}>{dateStr}</span>
                            </p>
                          </>
                        );
                      }

                      if (daysLeft === 0) {
                        return (
                          <>
                            <p className={cn(styles.daysLeft, styles.daysLeftSoon)}>
                              Последний день!
                            </p>
                            <p className={styles.dateText}>
                              Вернуть до: <span className={styles.dateValue}>{dateStr}</span>
                            </p>
                          </>
                        );
                      }

                      return (
                        <>
                          <p className={cn(
                            styles.daysLeft,
                            daysLeft <= 3 && styles.daysLeftSoon,
                          )}>
                            Осталось {daysLeft} {getDaysWord(daysLeft)}
                          </p>
                          <p className={styles.dateText}>
                            Вернуть до: <span className={styles.dateValue}>{dateStr}</span>
                  </p>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.extendButton}
                  onClick={() => handleExtendReservation(reservation.id)}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? 'Продление…'
                    : extendedEndDateLabel
                      ? `Продлить до ${extendedEndDateLabel}`
                      : 'Продлить на 7 дней'}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </PageTemplate>
  );
}
