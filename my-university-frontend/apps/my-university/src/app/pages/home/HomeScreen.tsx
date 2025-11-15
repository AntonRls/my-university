import { IconButton } from '@maxhub/max-ui';
import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import { PageTemplate } from '@shared/ui/page-template';
import { NotificationIcon } from '@shared/icons';
import type { UpcomingLesson } from '@entities/lesson';
import type { UpcomingDeadline } from '@entities/deadline';
import { HomeHighlightsCarousel } from '@widgets/home-highlights-carousel';
import { HomeQuickServices } from '@widgets/home-quick-services';
import { TeamRequestsNotification } from '@widgets/team-requests-notification';
import { fetchMyDeadlines, type Deadline } from '@api/deadline';

import styles from './HomeScreen.module.scss';
import carouselStyles from '@widgets/home-highlights-carousel/HomeHighlightsCarousel.module.scss';
import 'swiper/css';
import 'swiper/css/pagination';

const NEXT_LESSON: UpcomingLesson = {
  title: 'Алгоритмы и структуры данных',
  teacher: 'Алексей Корнилов',
  room: 'Ауд. 312',
  address: 'Главный корпус, Ленина 14',
  time: '09:00–10:35',
  lessonNumber: 1,
};

const NEXT_DEADLINE_FALLBACK: UpcomingDeadline = {
  title: 'Проект по интерфейсам',
  subject: 'UI/UX-практикум',
  dueDate: 'До 15 ноября, 18:00',
  timeLeft: 'Осталось 5 дней',
};

export function HomeScreen() {
  const [nextDeadline, setNextDeadline] = useState<UpcomingDeadline>(NEXT_DEADLINE_FALLBACK);

  useEffect(() => {
    void loadNextDeadline();
  }, []);

  const loadNextDeadline = async () => {
    try {
      const deadlines = await fetchMyDeadlines({ onlyActive: true });
      const upcoming = pickUpcomingDeadline(deadlines);
      if (upcoming) {
        setNextDeadline(upcoming);
      }
    } catch (error) {
      console.error('[home] failed to load deadlines', error);
    }
  };

  return (
    <PageTemplate
      title={['Мой', 'университет']}
      actions={(
        <IconButton
          type="button"
          size="medium"
          mode="secondary"
          appearance="neutral"
          aria-label="Открыть уведомления"
          className={styles.notificationButton}
        >
          <NotificationIcon className={styles.notificationIcon} />
        </IconButton>
      )}
    >
      <HomeHighlightsCarousel lesson={NEXT_LESSON} deadline={nextDeadline} />
      <Swiper
        className={carouselStyles.highlightsSlider}
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        slidesPerView={1}
        spaceBetween={16}
        loop
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
      >
        <SwiperSlide className={carouselStyles.highlightSlide}>
      <TeamRequestsNotification />
        </SwiperSlide>
      </Swiper>
      <HomeQuickServices />
    </PageTemplate>
  );
}

function pickUpcomingDeadline(deadlines: Deadline[]): UpcomingDeadline | null {
  if (deadlines.length === 0) {
    return null;
  }

  const sorted = [...deadlines].sort(
    (first, second) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime(),
  );

  const next = sorted.find((deadline) => new Date(deadline.dueAt) > new Date());

  if (!next) {
    return null;
  }

  return {
    title: next.title,
    subject: `Группа #${next.groupId}`,
    dueDate: formatReadableDate(next.dueAt),
    timeLeft: formatTimeLeft(next.dueAt),
  };
}

function formatReadableDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeLeft(value: string): string {
  const due = new Date(value).getTime();
  const now = Date.now();
  const diffMs = due - now;

  if (diffMs <= 0) {
    return 'Срок вышел';
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return `Осталось ${diffHours} ч`;
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `Осталось ${diffDays} дн`;
}

