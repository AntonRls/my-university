import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Typography } from '@maxhub/max-ui';

import { BookIcon } from '@shared/icons';
import { getBookUrl } from '@shared/config/routes';

import type { Book } from '@api/book';

import { useSwipe } from './hooks/useSwipe';
import { useBookActions } from './hooks/useBookActions';
import { getSwipeColor } from './utils/swipeColors';
import { SwipeActionLeft } from './components/SwipeActionLeft';
import { SwipeActionRight } from './components/SwipeActionRight';
import { BookmarkBadge } from './components/BookmarkBadge';
import { AvailabilityBadge } from './components/AvailabilityBadge';

import styles from './BookCard.module.scss';

type BookCardProps = {
  book: Book;
  // eslint-disable-next-line no-unused-vars
  onFavoriteChange?: (bookId: string, isFavorite: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onReservationChange?: (bookId: string, isReserved: boolean) => void;
};

function BookCardComponent({ book, onFavoriteChange, onReservationChange }: BookCardProps) {
  const navigate = useNavigate();

  const displayTags = useMemo<ReadonlyArray<string>>(
    () =>
      book.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 3),
    [book.tags],
  );
  const availableCount = book.availableCount ?? 0;
  const isEmpty = availableCount === 0;

  const {
    isBookmarked,
    isOrdered,
    isProcessing,
    handleBookmark,
    handleOrder,
  } = useBookActions({
    bookId: book.id,
    isEmpty,
    initialBookmarked: book.isFavorite,
    initialOrdered: book.isReserved,
    onBookmarkChange: (nextValue) => {
      onFavoriteChange?.(book.id, nextValue);
    },
    onReservationChange: (nextValue) => {
      onReservationChange?.(book.id, nextValue);
    },
  });

  const {
    swipeOffset,
    swipeDirection,
    bindCardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    cardStyle,
    consumeClickPrevention,
  } = useSwipe({
    onSwipeLeft: handleBookmark,
    onSwipeRight: handleOrder,
    isDisabled: isProcessing,
  });

  const showLeftAction = useMemo(
    () => swipeDirection === 'right' && swipeOffset > 0,
    [swipeDirection, swipeOffset],
  );
  const showRightAction = useMemo(
    () => swipeDirection === 'left' && swipeOffset < 0,
    [swipeDirection, swipeOffset],
  );

  const actionBackgroundColor = useMemo(
    () =>
      getSwipeColor({
        swipeDirection,
        swipeOffset,
        isEmpty,
        isBookmarked,
        isOrdered,
      }),
    [swipeDirection, swipeOffset, isEmpty, isBookmarked, isOrdered],
  );

  const handleCardClick = () => {
    if (consumeClickPrevention()) {
      return;
    }

    if (!isProcessing) {
      navigate(getBookUrl(book.id));
    }
  };

  return (
    <div className={styles.wrapper}>
      {showLeftAction ? (
        <SwipeActionLeft
          isEmpty={isEmpty}
          isOrdered={isOrdered}
          backgroundColor={actionBackgroundColor}
          swipeOffset={swipeOffset}
        />
      ) : null}

      {showRightAction ? (
        <SwipeActionRight
          isBookmarked={isBookmarked}
          backgroundColor={actionBackgroundColor}
          swipeOffset={swipeOffset}
        />
      ) : null}

      <article
        ref={bindCardRef}
        className={styles.card}
        aria-label={book.title}
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
      >
        <BookmarkBadge isVisible={isBookmarked} />

        <AvailabilityBadge availableCount={availableCount} isOrdered={isOrdered} />

        <div className={styles.cover}>
          <BookIcon className={styles.coverIcon} />
        </div>

        <div className={styles.content}>
          <Typography.Title className={styles.title}>{book.title}</Typography.Title>

          <Typography.Body className={styles.description}>{book.description}</Typography.Body>

          <Typography.Body className={styles.author}>{book.author}</Typography.Body>

          {displayTags.length > 0 ? (
            <ul className={styles.tags}>
              {displayTags.map((tag: string) => (
                <li key={tag} className={styles.tag}>
                  #{tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </div>
  );
}

export const BookCard = memo(BookCardComponent);

