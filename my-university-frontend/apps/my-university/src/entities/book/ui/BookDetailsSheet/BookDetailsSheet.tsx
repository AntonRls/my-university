import { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Typography, IconButton, Spinner } from '@maxhub/max-ui';

import { BottomSheet } from '@shared/ui/bottom-sheet/BottomSheet';
import { ActionButton } from '@shared/ui/action-button';
import { BookIcon, BookmarkIcon, FavoriteBooksIcon } from '@shared/icons';
import { KEYBOARD_KEYS } from '@shared/constants/keyboard';
import { cn } from '@shared/utils/className';

import type { Book } from '@api/book';
import { extendReservation, cancelReservation, toggleBookFavorite, reserveBook } from '@api/book';

import styles from './BookDetailsSheet.module.scss';

type TextWithFallback = {
  value: string;
  isFallback: boolean;
};

type AvailabilityTone = 'available' | 'empty' | 'unknown';

type AvailabilityInfo = {
  text: string;
  tone: AvailabilityTone;
};

const TEXT_PLACEHOLDERS = {
  author: 'Автор не указан',
  description: 'Описание пока отсутствует',
  tags: 'Теги не добавлены',
  reservation: 'Дата окончания брони не указана',
};

function getTextWithFallback(source: string | undefined | null, fallback: string): TextWithFallback {
  const normalized = source?.trim();

  if (normalized && normalized.length > 0) {
    return {
      value: normalized,
      isFallback: false,
    };
  }

  return {
    value: fallback,
    isFallback: true,
  };
}

function getCopiesLabel(count: number): string {
  const modulo10 = count % 10;
  const modulo100 = count % 100;

  if (modulo10 === 1 && modulo100 !== 11) {
    return 'экземпляр';
  }

  if (modulo10 >= 2 && modulo10 <= 4 && (modulo100 < 10 || modulo100 >= 20)) {
    return 'экземпляра';
  }

  return 'экземпляров';
}

function getAvailabilityInfo(availableCount: number | null | undefined): AvailabilityInfo {
  if (availableCount === null || availableCount === undefined) {
    return {
      text: 'Нет данных о наличии',
      tone: 'unknown',
    };
  }

  if (availableCount <= 0) {
    return {
      text: 'Все экземпляры заняты',
      tone: 'empty',
    };
  }

  return {
    text: `${availableCount} ${getCopiesLabel(availableCount)}`,
    tone: 'available',
  };
}

function getReservationDateInfo(reservationEndDate: string | undefined | null): TextWithFallback {
  if (!reservationEndDate) {
    return {
      value: TEXT_PLACEHOLDERS.reservation,
      isFallback: true,
    };
  }

  const date = new Date(reservationEndDate);

  if (Number.isNaN(date.getTime())) {
    return {
      value: TEXT_PLACEHOLDERS.reservation,
      isFallback: true,
    };
  }

  return {
    value: date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    isFallback: false,
  };
}

type BookDetailsSheetProps = {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onReservationChange?: (bookId: string, isReserved: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onFavoriteChange?: (bookId: string, isFavorite: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onReservationRefresh?: (bookId: string) => void;
};

export function BookDetailsSheet({
  book,
  isOpen,
  onClose,
  onReservationChange,
  onFavoriteChange,
  onReservationRefresh,
}: BookDetailsSheetProps) {
  const [isExtending, setIsExtending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCoverFlipped, setIsCoverFlipped] = useState(false);
  const [isFavorite, setIsFavorite] = useState(book?.isFavorite ?? false);

  const bookId = book?.id ?? null;

  useEffect(() => {
    if (!isOpen) {
      setActionError(null);
      setIsCoverFlipped(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setActionError(null);
    setIsCoverFlipped(false);
  }, [bookId]);

  useEffect(() => {
    if (!book?.isReserved) {
      setIsCoverFlipped(false);
    }
  }, [book?.isReserved]);

  useEffect(() => {
    if (book) {
      setIsFavorite(book.isFavorite);
    }
  }, [book]);

  const handleExtendReservation = useCallback(async () => {
    if (!book || isExtending) {
      return;
    }

    setIsExtending(true);
    setActionError(null);

    try {
      await extendReservation({ bookId: book.id });
      toast.success('Бронь успешно продлена');
      onReservationRefresh?.(book.id);
    } catch (error) {
      console.error('[book-details] extend reservation error:', error);
      toast.error('Не удалось продлить бронь');
      setActionError('Не удалось продлить бронь. Попробуйте еще раз позже.');
    } finally {
      setIsExtending(false);
    }
  }, [book, isExtending, onReservationRefresh]);

  const handleCancelReservation = useCallback(async () => {
    if (!book || isCancelling) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);

    try {
      await cancelReservation({ bookId: book.id });
      toast.success('Бронь успешно отменена');
      onReservationChange?.(book.id, false);
      onClose();
    } catch (error) {
      console.error('[book-details] cancel reservation error:', error);
      toast.error('Не удалось отменить бронь');
      setActionError('Не удалось отменить бронь. Попробуйте повторить действие.');
    } finally {
      setIsCancelling(false);
    }
  }, [book, isCancelling, onReservationChange, onClose]);

  const handleReserve = useCallback(async () => {
    if (!book || isReserving) {
      return;
    }

    if (book.availableCount <= 0) {
      toast.info('Все экземпляры книги заняты');
      return;
    }

    setIsReserving(true);
    setActionError(null);

    try {
      await reserveBook({ bookId: book.id });
      toast.success('Книга забронирована на 7 дней');
      onReservationChange?.(book.id, true);
    } catch (error) {
      console.error('[book-details] reserve error:', error);
      toast.error('Не удалось забронировать книгу');
      setActionError('Не удалось оформить бронь. Попробуйте еще раз позже.');
    } finally {
      setIsReserving(false);
    }
  }, [book, isReserving, onReservationChange]);

  const handleCoverToggle = useCallback(() => {
    if (!book || !book.isReserved) {
      return;
    }

    setIsCoverFlipped((previous) => !previous);
  }, [book]);

  const handleToggleFavorite = useCallback(async () => {
    if (!book || isTogglingFavorite) {
      return;
    }

    setIsTogglingFavorite(true);
    setActionError(null);

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    try {
      await toggleBookFavorite({ bookId: book.id });
      onFavoriteChange?.(book.id, nextState);
      toast.success(
        nextState ? 'Книга добавлена в избранное' : 'Книга удалена из избранного',
      );
    } catch (error) {
      console.error('[book-details] toggle favorite error:', error);
      setIsFavorite(!nextState);
      toast.error('Не удалось обновить избранное');
      setActionError('Не удалось обновить избранное. Попробуйте еще раз позже.');
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [book, isTogglingFavorite, isFavorite, onFavoriteChange]);

  const authorInfo = useMemo(
    () => (book ? getTextWithFallback(book.author, TEXT_PLACEHOLDERS.author) : { value: '', isFallback: true }),
    [book?.author],
  );

  const descriptionInfo = useMemo(
    () => (book ? getTextWithFallback(book.description, TEXT_PLACEHOLDERS.description) : { value: '', isFallback: true }),
    [book?.description],
  );

  const tags = useMemo(
    () =>
      book
        ? book.tags
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [],
    [book?.tags],
  );

  const availabilityInfo = useMemo(
    () => (book ? getAvailabilityInfo(book.availableCount) : null),
    [book?.availableCount],
  );

  const reservationDateInfo = useMemo(
    () => (book ? getReservationDateInfo(book.reservationEndDate) : null),
    [book?.reservationEndDate],
  );

  if (!book) {
    return null;
  }

  const isProcessing = isExtending || isCancelling || isTogglingFavorite || isReserving;
  const hasTags = tags.length > 0;

  const coverButtonLabel = book.isReserved
    ? isCoverFlipped
      ? 'Скрыть QR-код бронирования'
      : 'Показать QR-код бронирования'
    : 'QR-код будет доступен после бронирования';

  const coverHintText = book.isReserved
    ? isCoverFlipped
      ? 'Нажмите ещё раз, чтобы скрыть QR-код'
      : 'Нажмите на обложку, чтобы показать QR-код'
    : 'QR-код появится после оформления брони';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      className={styles.sheet}
      contentClassName={styles.content}
      footerClassName={styles.footer}
      footer={
        <div className={styles.footerContent}>
          {actionError ? (
            <div className={styles.actionError} role="alert" aria-live="assertive">
              <Typography.Body className={styles.actionErrorTitle}>
                Не удалось выполнить действие
              </Typography.Body>
              <Typography.Body className={styles.actionErrorDescription}>
                {actionError}
              </Typography.Body>
            </div>
          ) : null}

          <div className={styles.footerActions}>
            {book.isReserved ? (
              <>
                <ActionButton
                  variant="secondary"
                  isLoading={isExtending}
                  disabled={isProcessing}
                  onClick={handleExtendReservation}
                >
                  Продлить бронь на 7 дней
                </ActionButton>
                <ActionButton
                  variant="danger"
                  isLoading={isCancelling}
                  disabled={isProcessing}
                  onClick={handleCancelReservation}
                >
                  Отменить бронь
                </ActionButton>
              </>
            ) : (
              <ActionButton
                variant="secondary"
                isLoading={isReserving}
                disabled={isProcessing || book.availableCount <= 0}
                onClick={handleReserve}
              >
                Забронировать на 7 дней
              </ActionButton>
            )}
          </div>
        </div>
      }
    >
      <div className={styles.headerActions}>
        <IconButton
          type="button"
          size="medium"
          mode="secondary"
          appearance="neutral"
          onClick={handleToggleFavorite}
          disabled={isProcessing || isTogglingFavorite}
          className={cn(
            styles.favoriteButton,
            isFavorite && styles.favoriteButtonActive,
          )}
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          {isTogglingFavorite ? (
            <Spinner size={20} />
          ) : isFavorite ? (
            <FavoriteBooksIcon className={styles.favoriteIcon} />
          ) : (
            <BookmarkIcon className={styles.favoriteIcon} />
          )}
        </IconButton>
      </div>

      <div className={styles.container}>
        <div className={styles.coverSection}>
          <div
            className={cn(
              styles.coverContainer,
              isCoverFlipped && styles.coverContainerActive,
              !book.isReserved && styles.coverContainerDisabled,
            )}
            onClick={book.isReserved ? handleCoverToggle : undefined}
            role={book.isReserved ? 'button' : undefined}
            tabIndex={book.isReserved ? 0 : undefined}
            aria-pressed={book.isReserved ? isCoverFlipped : undefined}
            aria-label={coverButtonLabel}
            onKeyDown={
              book.isReserved
                ? (e) => {
                    if (e.key === KEYBOARD_KEYS.ENTER || e.key === KEYBOARD_KEYS.SPACE) {
                      e.preventDefault();
                      handleCoverToggle();
                    }
                  }
                : undefined
            }
          >
            <span className={styles.coverCard}>
              <span
                className={cn(
                  styles.coverFace,
                  styles.coverFaceFront,
                  isCoverFlipped && styles.coverFaceHidden,
                )}
                aria-hidden={isCoverFlipped}
              >
                <BookIcon className={styles.coverIcon} aria-hidden="true" />
              </span>

              {book.isReserved ? (
                <span
                  className={cn(
                    styles.coverFace,
                    styles.coverFaceBack,
                    !isCoverFlipped && styles.coverFaceHidden,
                  )}
                  aria-hidden={!isCoverFlipped}
                >
                  <div className={styles.coverQrWrapper}>
                    <QRCodeSVG
                      value={String(book.id)}
                      size={190}
                      level="M"
                      includeMargin={false}
                      bgColor="transparent"
                      fgColor="#F9FAFB"
                      className={styles.coverQr}
                    />
                  </div>
                </span>
              ) : null}
            </span>
          </div>

          <Typography.Body className={styles.coverHint}>{coverHintText}</Typography.Body>
        </div>

        <div className={styles.info}>
          <Typography.Title className={styles.bookTitle}>{book.title}</Typography.Title>

          <div className={styles.field}>
            <Typography.Body className={styles.label}>Автор</Typography.Body>
            <Typography.Body
              className={cn(styles.value, authorInfo.isFallback && styles.placeholder)}
            >
              {authorInfo.value}
            </Typography.Body>
          </div>

          <div className={styles.field}>
            <Typography.Body className={styles.label}>Описание</Typography.Body>
            <Typography.Body
              className={cn(styles.value, descriptionInfo.isFallback && styles.placeholder)}
            >
              {descriptionInfo.value}
            </Typography.Body>
          </div>

          <div className={styles.field}>
            <Typography.Body className={styles.label}>Доступно для брони</Typography.Body>
            <Typography.Body
              className={cn(
                styles.value,
                styles.availability,
                availabilityInfo?.tone === 'empty' && styles.availabilityEmpty,
                availabilityInfo?.tone === 'unknown' && styles.availabilityUnknown,
              )}
            >
              {availabilityInfo?.text ?? 'Нет данных о наличии'}
            </Typography.Body>
          </div>

          {book.isReserved && reservationDateInfo ? (
            <div className={styles.field}>
              <Typography.Body className={styles.label}>Дата окончания брони</Typography.Body>
              <Typography.Body
                className={cn(
                  styles.valueHighlight,
                  reservationDateInfo.isFallback && styles.placeholder,
                )}
              >
                {reservationDateInfo.value}
              </Typography.Body>
            </div>
          ) : null}

          {hasTags ? (
            <div className={styles.field}>
              <Typography.Body className={styles.label}>Теги</Typography.Body>
              <ul className={styles.tags}>
                {tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className={styles.field}>
              <Typography.Body className={styles.label}>Теги</Typography.Body>
              <Typography.Body className={cn(styles.value, styles.placeholder)}>
                {TEXT_PLACEHOLDERS.tags}
              </Typography.Body>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

