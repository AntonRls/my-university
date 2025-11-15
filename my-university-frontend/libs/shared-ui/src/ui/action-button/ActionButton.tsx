import type { ReactNode } from 'react';

import { Button, Spinner } from '@maxhub/max-ui';

import { cn } from '@shared/utils/className';

import styles from './ActionButton.module.scss';

export type ActionButtonVariant = 'secondary' | 'danger' | 'favorite';

export type ActionButtonProps = {
  children: ReactNode;
  variant?: ActionButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
};

export function ActionButton({
  children,
  variant = 'secondary',
  isLoading = false,
  disabled = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}: ActionButtonProps) {
  const isDisabled = disabled || isLoading;
  const variantClassName = styles[`button${variant.charAt(0).toUpperCase() + variant.slice(1)}`];

  return (
    <div className={cn(styles.wrapper, variantClassName, className)}>
      <Button
        type="button"
        mode="secondary"
        appearance="neutral"
        onClick={onClick}
        disabled={isDisabled}
        className={styles.button}
        aria-label={ariaLabel}
      >
        {isLoading ? (
          <div className={styles.loaderContainer}>
            <Spinner size={16} className={styles.spinner} />
            <span className={styles.text}>{children}</span>
          </div>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}

