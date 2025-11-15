import {
  useUser,
  useUserId,
  useUserFullName,
  useUserInitials,
  useHasUserData,
} from '@shared/hooks';

import styles from './UserInfoDemo.module.scss';

/**
 * Демонстрационный компонент для отображения данных пользователя
 */
export function UserInfoDemo() {
  const {
    user,
    platform,
    version,
    isMaxBridgeAvailable,
    isInitialized,
    hasUserData,
    fullName,
    initials,
    service,
  } = useUser();

  const userId = useUserId();
  const fullNameHook = useUserFullName();
  const initialsHook = useUserInitials();
  const hasData = useHasUserData();

  if (!isInitialized) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка данных пользователя...</div>
      </div>
    );
  }

  if (!isMaxBridgeAvailable) {
    return (
      <div className={styles.container}>
        <div className={styles.warning}>
          MAX Bridge недоступен. Откройте приложение через MAX.
        </div>
      </div>
    );
  }

  if (!hasUserData) {
    return (
      <div className={styles.container}>
        <div className={styles.warning}>Данные пользователя недоступны</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Информация о пользователе</h1>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Из хука useUser()</h2>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>ID:</span>
            <span>{user?.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Имя:</span>
            <span>{user?.first_name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Фамилия:</span>
            <span>{user?.last_name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Username:</span>
            <span>@{user?.username}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Язык:</span>
            <span>{user?.language_code}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Полное имя:</span>
            <span>{fullName}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Инициалы:</span>
            <span>{initials}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Специализированные хуки</h2>
        <div className={styles.info}>
          <div className={styles.infoItem}>
            <span className={styles.label}>useUserId():</span>
            <span>{userId}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>useUserFullName():</span>
            <span>{fullNameHook}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>useUserInitials():</span>
            <span>{initialsHook}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>useHasUserData():</span>
            <span>{hasData ? 'Да' : 'Нет'}</span>
          </div>
        </div>
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
          <div className={styles.infoItem}>
            <span className={styles.label}>MAX Bridge:</span>
            <span>{isMaxBridgeAvailable ? 'Доступен' : 'Недоступен'}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Методы UserService</h2>
        <div className={styles.actions}>
          <button
            className={styles.button}
            onClick={() => {
              console.warn('Debug Info:', service.getDebugInfo());
            }}
          >
            Вывести Debug Info в консоль
          </button>

          <button
            className={styles.button}
            onClick={() => {
              service.refresh();
            }}
          >
            Обновить данные
          </button>

          <button
            className={styles.button}
            onClick={() => {
              console.warn('User ID:', service.getUserId());
              console.warn('User Name:', service.getUserName());
              console.warn('Username:', service.getUsername());
              console.warn('Language:', service.getLanguage());
              console.warn('Photo URL:', service.getPhotoUrl());
            }}
          >
            Вывести методы сервиса
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.subtitle}>Фото профиля</h2>
        <div className={styles.photoContainer}>
        {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={`${user.first_name} ${user.last_name}`}
              className={styles.photo}
            />
        ) : (
          <div className={styles.avatarPlaceholder}>
              <span className={styles.avatarText}>{initials ?? 'Нет данных'}</span>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

