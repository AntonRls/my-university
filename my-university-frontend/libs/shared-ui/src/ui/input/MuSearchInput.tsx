import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { SearchIcon } from '@shared/icons';
import { cn } from '@shared/utils/className';

import { MuInput } from './MuInput';
import styles from './MuSearchInput.module.scss';

export type MuSearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const MuSearchInput = forwardRef<HTMLInputElement, MuSearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn(styles.wrapper, className)}>
        <SearchIcon className={styles.icon} />
        <MuInput ref={ref} className={styles.input} {...props} />
      </div>
    );
  }
);

MuSearchInput.displayName = 'MuSearchInput';

