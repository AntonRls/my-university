import { Button, Typography } from '@maxhub/max-ui';

import type { EventTag, UniversityEvent } from '@entities/event';
import {
  formatEventDuration,
  formatEventPeriod,
  formatEventTimeRange,
  formatParticipantsStatus,
} from '@entities/event';

import styles from './EventCard.module.scss';

export type EventCardProps = {
  event: UniversityEvent;
  isRegistering: boolean;
  multiDayDayNumber?: number;
  onRegister: (event: UniversityEvent) => void;
  onUnregister: (event: UniversityEvent) => void;
};

export function EventCard({
  event: eventData,
  onRegister,
  onUnregister,
  isRegistering,
  multiDayDayNumber,
}: EventCardProps) {
  const event = eventData;
  const timeRange = formatEventTimeRange(event.startDateTime, event.endDateTime);
  const periodLabel = formatEventPeriod(event.startDateTime, event.endDateTime);
  const durationLabel = formatEventDuration(event.startDateTime, event.endDateTime);
  const participantsLabel = formatParticipantsStatus(
    event.registeredParticipantsCount,
    event.participantsLimit,
  );
  const hasTags = event.tags.length > 0;

  const { isRegistered } = event;

  const isAtCapacity =
    event.participantsLimit !== null &&
    event.registeredParticipantsCount >= event.participantsLimit;

  const isButtonDisabled =
    (!isRegistered && (isRegistering || isAtCapacity)) || (isRegistered && isRegistering);

  const buttonLabel = isRegistered
    ? isRegistering
      ? 'Отменяем...'
      : 'Отменить запись'
    : isRegistering
      ? 'Записываем...'
      : isAtCapacity
        ? 'Лимит достигнут'
        : 'Записаться';

  const handleButtonClick = () => {
    if (isRegistered) {
      onUnregister(event);
    } else {
      onRegister(event);
    }
  };

  return (
    <article className={styles.card} aria-label={event.title}>
      <header className={styles.header}>
        {multiDayDayNumber ? (
          <span className={styles.multiDayBadge}>{`День ${multiDayDayNumber}`}</span>
        ) : null}
        {timeRange ? <span className={styles.timeBadge}>{timeRange}</span> : null}
      </header>

      <div className={styles.content}>
        <Typography.Title className={styles.title}>{event.title}</Typography.Title>
        <Typography.Body className={styles.description}>{event.description}</Typography.Body>
      </div>

      <dl className={styles.meta}>
        {periodLabel ? (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Время проведения:</dt>
            <dd className={styles.metaValue}>{periodLabel}</dd>
          </div>
        ) : null}

        {durationLabel ? (
          <div className={styles.metaItem}>
            <dt className={styles.metaLabel}>Длительность:</dt>
            <dd className={styles.metaValue}>{durationLabel}</dd>
          </div>
        ) : null}

        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Где:</dt>
          <dd className={styles.metaValue}>{event.location}</dd>
        </div>

        <div className={styles.metaItem}>
          <dt className={styles.metaLabel}>Участники:</dt>
          <dd className={styles.metaValue}>{participantsLabel}</dd>
        </div>
      </dl>

      <footer className={styles.footer}>
        <ul className={styles.tags}>
          {hasTags ? (
            event.tags.map((tag: EventTag) => (
              <li key={tag.id} className={styles.tag}>
                #{tag.name}
              </li>
            ))
          ) : (
            <li className={styles.tag}>#без-тегов</li>
          )}
        </ul>

        <Button
          type="button"
          size="medium"
          mode={isRegistered ? 'secondary' : 'primary'}
          appearance={isRegistered ? 'neutral' : 'themed'}
          className={styles.actionButton}
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
          aria-busy={isRegistering}
        >
          <span className={styles.actionButtonLabel}>{buttonLabel}</span>
        </Button>
      </footer>
    </article>
  );
}
