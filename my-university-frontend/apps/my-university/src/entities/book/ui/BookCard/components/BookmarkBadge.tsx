import { memo } from 'react';

import { BookmarkIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';

import styles from '../BookCard.module.scss';

type BookmarkBadgeProps = {
  isVisible: boolean;
};

function BookmarkBadgeComponent({ isVisible }: BookmarkBadgeProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(styles.bookmarkBadge, {
        [styles.bookmarkBadgeVisible]: isVisible,
      })}
    >
      <BookmarkIcon className={styles.bookmarkIcon} fill="currentColor" />
    </div>
  );
}

export const BookmarkBadge = memo(BookmarkBadgeComponent);

