import { useState } from 'react';

import { useMaxBridge, useBackButton } from '@shared/hooks';

import styles from './MaxBridgeDemo.module.scss';

/**
 * Демонстрационный компонент для работы с MAX Bridge
 * Показывает основные возможности сервиса
 */
export function MaxBridgeDemo() {
  const { isAvailable, user, platform, version, service } = useMaxBridge();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string>('');

  useBackButton(() => {
    service.close();
  }, isAvailable);

  if (!isAvailable) {
    return (
      <div className={styles.container}>
        <div className={styles.warning}>
          MAX Bridge недоступен. Откройте приложение через MAX.
        </div>
      </div>
    );
  }

  const handleScanQr = async () => {
    const result = await service.openCodeReader(true);
    if (result) {
      setQrCode(result);
      service.haptic.notification('success');
    }
  };

  const handleShare = async () => {
    const status = await service.shareMaxContent(
      'Проверь мини-приложение My University!',
      'https://max.ru/myuniversity'
    );
    setShareStatus(status || 'error');
    
    if (status === 'shared') {
      service.haptic.notification('success');
    }
  };

  const handleRequestPhone = async () => {
    const contact = await service.requestContact();
    if (contact) {
      service.haptic.notification('success');
    }
  };

  const handleVibrate = (type: 'soft' | 'medium' | 'heavy') => {
    service.haptic.impact(type);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MAX Bridge Demo</h1>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Информация о пользователе</h2>
        {user ? (
          <div className={styles.info}>
            <div className={styles.infoItem}>
              <span className={styles.label}>ID:</span>
              <span>{user.id}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Имя:</span>
              <span>{user.first_name} {user.last_name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Username:</span>
              <span>@{user.username}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Язык:</span>
              <span>{user.language_code}</span>
            </div>
          </div>
        ) : (
          <div className={styles.noData}>Данные пользователя недоступны</div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Платформа</h2>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Платформа:</span>
            <span>{platform}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Версия MAX:</span>
            <span>{version}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Действия</h2>
        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={handleScanQr}
          >
            Сканировать QR-код
          </button>

          <button
            className={styles.button}
            onClick={handleShare}
          >
            Поделиться
          </button>

          <button
            className={styles.button}
            onClick={handleRequestPhone}
          >
            Запросить номер телефона
          </button>

          <button
            className={styles.button}
            onClick={() => service.openLink('https://example.com')}
          >
            Открыть ссылку
          </button>
        </div>

        {qrCode && (
          <div className={styles.result}>
            <strong>QR-код:</strong> {qrCode}
          </div>
        )}

        {shareStatus && (
          <div className={styles.result}>
            <strong>Статус шаринга:</strong> {shareStatus}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Вибрация</h2>
        <div className={styles.actions}>
          <button
            className={styles.buttonSmall}
            onClick={() => handleVibrate('soft')}
          >
            Мягкая
          </button>
          <button
            className={styles.buttonSmall}
            onClick={() => handleVibrate('medium')}
          >
            Средняя
          </button>
          <button
            className={styles.buttonSmall}
            onClick={() => handleVibrate('heavy')}
          >
            Сильная
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Управление</h2>
        <div className={styles.actions}>
          <button
            className={styles.buttonDanger}
            onClick={() => service.close()}
          >
            Закрыть приложение
          </button>
        </div>
      </section>
    </div>
  );
}

