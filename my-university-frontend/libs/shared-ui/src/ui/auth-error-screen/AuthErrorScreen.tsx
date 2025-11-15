import { useCallback } from 'react';

import { NetworkErrorIcon, RefreshIcon } from '@shared/icons';
import { authService } from '@api/services';

import styles from './AuthErrorScreen.module.scss';

type AuthErrorScreenProps = {
  error: string;
};

function getErrorTitle(errorMessage: string): string {
  if (errorMessage.toLowerCase().includes('failed to fetch')) {
    return 'Нет соединения с сервером';
  }

  if (errorMessage.toLowerCase().includes('network')) {
    return 'Ошибка сети';
  }

  return 'Ошибка авторизации';
}

function getErrorDescription(errorMessage: string): string {
  if (errorMessage.toLowerCase().includes('failed to fetch')) {
    return 'Не удалось подключиться к серверу. Проверьте подключение к интернету и убедитесь, что бэкенд запущен.';
  }

  if (errorMessage.toLowerCase().includes('network')) {
    return 'Проверьте подключение к интернету и попробуйте снова.';
  }

  return 'Не удалось выполнить авторизацию. Проверьте настройки и попробуйте снова.';
}

export function AuthErrorScreen({ error }: AuthErrorScreenProps) {
  const errorTitle = getErrorTitle(error);
  const errorDescription = getErrorDescription(error);

  const handleRetry = useCallback(() => {
    void authService.init();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <NetworkErrorIcon className={styles.icon} />
        </div>

        <div className={styles.textContent}>
          <h1 className={styles.title}>{errorTitle}</h1>
          <p className={styles.message}>{errorDescription}</p>

          {error ? <div className={styles.errorDetails}>{error}</div> : null}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.retryButton} onClick={handleRetry}>
            <RefreshIcon className={styles.refreshIcon} />
            Повторить попытку
          </button>

          <p className={styles.helpText}>
            Если проблема сохраняется, убедитесь что бэкенд запущен на{' '}
            <span className={styles.helpLink}>https://linguabigben.ru</span>
          </p>
        </div>
      </div>
    </div>
  );
}
