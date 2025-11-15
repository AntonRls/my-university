import { Button, Typography } from '@maxhub/max-ui';

import { ErrorIcon } from '@shared/icons';

import styles from './ErrorState.module.scss';

type ErrorStateProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({ title, message, onRetry, retryLabel = 'Повторить попытку' }: ErrorStateProps) {
  return (
    <div className={styles.root}>
      <ErrorIcon className={styles.icon} aria-hidden />
      <Typography.Title className={styles.title}>{title}</Typography.Title>
      {message ? <Typography.Body className={styles.message}>{message}</Typography.Body> : null}
      {onRetry ? (
        <Button
          type="button"
          size="medium"
          mode="secondary"
          appearance="neutral"
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

