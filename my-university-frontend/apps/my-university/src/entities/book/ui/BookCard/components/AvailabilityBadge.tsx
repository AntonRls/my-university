import { memo } from 'react';

import { cn } from '@shared/utils/className';

import { getAvailabilityText } from '../utils/getAvailabilityText';

import styles from '../BookCard.module.scss';

type AvailabilityBadgeProps = {
  availableCount: number;
  isOrdered: boolean;
};

function AvailabilityBadgeComponent({ availableCount, isOrdered }: AvailabilityBadgeProps) {
  if (isOrdered) {
    return (
      <div className={styles.orderedBadge}>
        Заказана
      </div>
    );
  }

  const isEmpty = availableCount === 0;

  return (
    <div
      className={cn(styles.availabilityBadge, {
        [styles.availabilityBadgeEmpty]: isEmpty,
      })}
    >
      {getAvailabilityText(availableCount)}
    </div>
  );
}

export const AvailabilityBadge = memo(AvailabilityBadgeComponent);

