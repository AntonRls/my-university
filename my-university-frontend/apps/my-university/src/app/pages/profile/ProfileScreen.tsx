import { Typography } from '@maxhub/max-ui';

import { useUser } from '@shared/hooks';
import type { Platform } from '@api/types';
import { FilterCard } from '@shared/ui/filter-card';
import { PageTemplate } from '@shared/ui/page-template';
import { UserAvatar } from '@shared/ui/user-avatar';
import { cn } from '@shared/utils/className';

import styles from './ProfileScreen.module.scss';

const PLATFORM_LABEL_MAP: Record<Platform, string> = {
  ios: 'iOS',
  android: 'Android',
  desktop: 'Desktop',
  web: 'Web',
};

type StatusTone = 'neutral' | 'positive' | 'warning';

type StatusChip = {
  id: string;
  label: string;
  value: string;
  tone: StatusTone;
};

type DetailItem = {
  label: string;
  value: string;
};

export function ProfileScreen() {
  const {
    user,
    fullName,
    initials,
    platform,
    version,
    isMaxBridgeAvailable,
    isInitialized,
    hasUserData,
  } = useUser();

  const displayName = isInitialized ? fullName ?? 'Гость' : 'Загрузка...';
  const usernameDisplay = isInitialized ? (user?.username ? `@${user.username}` : '—') : '…';
  const avatarInitials = isInitialized ? initials : null;
  const languageDisplay = isInitialized ? user?.language_code?.toUpperCase() ?? '—' : '…';
  const userIdDisplay = isInitialized ? (user?.id ? `#${user.id}` : '—') : '…';
  const platformDisplay = isInitialized
    ? platform
      ? PLATFORM_LABEL_MAP[platform]
      : '—'
    : '…';
  const versionDisplay = isInitialized ? version ?? '—' : '…';
  const bridgeStatusDisplay = isInitialized
    ? isMaxBridgeAvailable
      ? 'Доступен'
      : 'Недоступен'
    : '…';
  const dataStatusDisplay = isInitialized ? (hasUserData ? 'Активны' : 'Нет данных') : '…';

  const statusChips: StatusChip[] = [
    {
      id: 'bridge',
      label: 'MAX Bridge',
      value: bridgeStatusDisplay,
      tone: !isInitialized ? 'neutral' : isMaxBridgeAvailable ? 'positive' : 'warning',
    },
    {
      id: 'data',
      label: 'Данные',
      value: dataStatusDisplay,
      tone: !isInitialized ? 'neutral' : hasUserData ? 'positive' : 'warning',
    },
    {
      id: 'platform',
      label: 'Платформа',
      value: platformDisplay,
      tone: 'neutral',
    },
  ];

  const identityDetails: DetailItem[] = [
    { label: 'Полное имя', value: displayName },
    { label: 'Имя пользователя', value: usernameDisplay },
    { label: 'Язык интерфейса', value: languageDisplay },
  ];

  const systemDetails: DetailItem[] = [
    { label: 'ID пользователя', value: userIdDisplay },
    { label: 'Версия MAX', value: versionDisplay },
    { label: 'MAX Bridge', value: bridgeStatusDisplay },
  ];

  return (
    <PageTemplate
      title={['Профиль', 'студента']}
      contentClassName={styles.content}
    >
      <FilterCard className={styles.heroCard}>
        <div className={styles.avatarWrapper}>
          <UserAvatar
            size={96}
            initials={avatarInitials}
            photoUrl={user?.photo_url}
            className={styles.avatar}
          />
        </div>

        <div className={styles.heroInfo}>
          <Typography.Label className={styles.heroLabel}>
            {isInitialized ? 'Личный профиль' : 'Загрузка профиля'}
          </Typography.Label>
          <Typography.Title className={styles.heroName}>{displayName}</Typography.Title>
          <Typography.Body className={styles.heroUsername}>{usernameDisplay}</Typography.Body>

          <div className={styles.statusChips}>
            {statusChips.map((chip) => (
              <span
                key={chip.id}
                className={cn(styles.statusChip, {
                  [styles.statusChipPositive]: chip.tone === 'positive',
                  [styles.statusChipWarning]: chip.tone === 'warning',
                })}
              >
                <span className={styles.statusChipLabel}>{chip.label}</span>
                <span className={styles.statusChipValue}>{chip.value}</span>
              </span>
            ))}
          </div>
        </div>
      </FilterCard>

      <div className={styles.detailsGrid}>
        <FilterCard className={styles.detailsCard}>
          <Typography.Label className={styles.cardTitle}>Основные данные</Typography.Label>
          <dl className={styles.detailsList}>
            {identityDetails.map((item) => (
              <div key={item.label} className={styles.detailItem}>
                <dt className={styles.detailLabel}>{item.label}</dt>
                <dd className={styles.detailValue}>{item.value}</dd>
              </div>
            ))}
          </dl>
        </FilterCard>

        <FilterCard className={styles.detailsCard}>
          <Typography.Label className={styles.cardTitle}>Система и доступ</Typography.Label>
          <dl className={styles.detailsList}>
            {systemDetails.map((item) => (
              <div key={item.label} className={styles.detailItem}>
                <dt className={styles.detailLabel}>{item.label}</dt>
                <dd className={styles.detailValue}>{item.value}</dd>
              </div>
            ))}
          </dl>
          {!isInitialized ? (
            <Typography.Body className={styles.mutedText}>Данные синхронизируются…</Typography.Body>
          ) : null}
          {isInitialized && !hasUserData ? (
            <Typography.Body className={styles.mutedText}>
              Данные пользователя недоступны
            </Typography.Body>
          ) : null}
        </FilterCard>
      </div>
    </PageTemplate>
  );
}
