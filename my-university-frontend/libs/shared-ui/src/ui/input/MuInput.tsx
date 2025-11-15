import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@shared/utils/className';

import styles from './MuInput.module.scss';

export type MuInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export const MuInput = forwardRef<HTMLInputElement, MuInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(styles.input, className)}
        {...props}
      />
    );
  }
);

MuInput.displayName = 'MuInput';

