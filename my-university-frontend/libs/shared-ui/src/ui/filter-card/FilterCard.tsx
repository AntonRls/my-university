import type { ReactNode } from 'react';

import { cn } from '@shared/utils/className';

import styles from './FilterCard.module.scss';

type FilterCardProps = {
  children: ReactNode;
  className?: string;
};

export function FilterCard({ children, className }: FilterCardProps) {
  return <div className={cn(styles.root, className)}>{children}</div>;
}
