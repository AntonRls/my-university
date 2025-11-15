import { memo, useMemo } from 'react';

import { BookmarkIcon } from '@shared/icons';

import styles from '../BookCard.module.scss';

type SwipeActionRightProps = {
  isBookmarked: boolean;
  backgroundColor?: string;
  swipeOffset: number;
};

function SwipeActionRightComponent({
  isBookmarked,
  backgroundColor,
  swipeOffset,
}: SwipeActionRightProps) {
  const actionStyle: React.CSSProperties = useMemo(
    () => ({
      backgroundColor,
      transition: swipeOffset === 0 ? 'background-color 200ms ease' : 'none',
    }),
    [backgroundColor, swipeOffset],
  );

  return (
    <div className={styles.swipeActionRight} style={actionStyle}>
      <div className={styles.swipeActionContent}>
        <BookmarkIcon
          className={styles.swipeActionIcon}
          fill={isBookmarked ? 'currentColor' : 'none'}
        />
        <span className={styles.swipeActionText}>
          {isBookmarked ? (
            <>
              Убрать из<br />
              закладок
            </>
          ) : (
            'В закладки'
          )}
        </span>
      </div>
    </div>
  );
}

export const SwipeActionRight = memo(SwipeActionRightComponent);

