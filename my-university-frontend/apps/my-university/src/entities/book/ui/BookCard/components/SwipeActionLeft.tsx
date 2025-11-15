import { memo, useMemo } from 'react';

import { CloseIcon, CartIcon } from '@shared/icons';

import styles from '../BookCard.module.scss';

type SwipeActionLeftProps = {
  isEmpty: boolean;
  isOrdered: boolean;
  backgroundColor?: string;
  swipeOffset: number;
};

function SwipeActionLeftComponent({
  isEmpty,
  isOrdered,
  backgroundColor,
  swipeOffset,
}: SwipeActionLeftProps) {
  const actionStyle: React.CSSProperties = useMemo(
    () => ({
      backgroundColor,
      transition: swipeOffset === 0 ? 'background-color 200ms ease' : 'none',
    }),
    [backgroundColor, swipeOffset],
  );

  return (
    <div className={styles.swipeActionLeft} style={actionStyle}>
      <div className={styles.swipeActionContent}>
        {isEmpty ? (
          <span className={styles.swipeActionText}>
            Нет в<br />
            наличии
          </span>
        ) : isOrdered ? (
          <>
            <CloseIcon className={styles.swipeActionIcon} />
            <span className={styles.swipeActionText}>
              Отменить<br />
              заказ
            </span>
          </>
        ) : (
          <>
            <CartIcon className={styles.swipeActionIcon} />
            <span className={styles.swipeActionText}>Заказать</span>
          </>
        )}
      </div>
    </div>
  );
}

export const SwipeActionLeft = memo(SwipeActionLeftComponent);

