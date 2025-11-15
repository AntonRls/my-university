import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';

import type { UpcomingLesson } from '@entities/lesson';
import type { UpcomingDeadline } from '@entities/deadline';
import { HighlightCard } from '@shared/ui/highlight-card';

import styles from './HomeHighlightsCarousel.module.scss';
import 'swiper/css';
import 'swiper/css/pagination';

type HomeHighlightsCarouselProps = {
  lesson: UpcomingLesson;
  deadline: UpcomingDeadline;
};

export function HomeHighlightsCarousel({ lesson, deadline }: HomeHighlightsCarouselProps) {
  return (
    <Swiper
      className={styles.highlightsSlider}
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
      <SwiperSlide className={styles.highlightSlide}>
        <HighlightCard title="Ближайшая пара">
          <article className={styles.lessonCard}>
            <div className={styles.lessonMeta}>
              <span className={styles.lessonNumber}>{lesson.lessonNumber} пара</span>
              <span className={styles.lessonTime}>{lesson.time}</span>
            </div>
            <h3 className={styles.lessonName}>{lesson.title}</h3>
            <div className={styles.lessonDetails}>
              <span className={styles.lessonTeacher}>{lesson.teacher}</span>
              <div className={styles.lessonLocation}>
                <span className={styles.lessonRoom}>{lesson.room}</span>
                <span className={styles.lessonAddress}>{lesson.address}</span>
              </div>
            </div>
          </article>
        </HighlightCard>
      </SwiperSlide>

      <SwiperSlide className={styles.highlightSlide}>
        <HighlightCard title="Ближайший дедлайн" variant="urgent">
          <article className={styles.deadlineCard}>
            <h3 className={styles.deadlineName}>{deadline.title}</h3>
            <div className={styles.deadlineDetails}>
              <span className={styles.deadlineSubject}>{deadline.subject}</span>
              <div className={styles.deadlineMeta}>
                <span className={styles.deadlineDueDate}>{deadline.dueDate}</span>
                <span className={styles.deadlineTimeLeft}>{deadline.timeLeft}</span>
              </div>
            </div>
          </article>
        </HighlightCard>
      </SwiperSlide>
    </Swiper>
  );
}

