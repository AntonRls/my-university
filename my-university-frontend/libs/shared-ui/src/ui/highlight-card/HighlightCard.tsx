import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@shared/utils/className';

import styles from './HighlightCard.module.scss';

type HighlightCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'accent' | 'urgent';
};

export function HighlightCard({
  title,
  children,
  className,
  variant = 'default',
}: HighlightCardProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return true;
    }
    return false;
  });
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const element = sectionRef.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    let animationFrameId = 0;

    const observer = new window.IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (!entry) {
          return;
        }

        window.cancelAnimationFrame(animationFrameId);

        animationFrameId = window.requestAnimationFrame(() => {
          setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0.2);
        });
      },
      {
        threshold: [0, 0.2, 0.35, 0.5, 0.75, 1],
      }
    );

    observer.observe(element);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, []);

  const variantClassName =
    variant === 'accent'
      ? styles.highlightSectionAccent
      : variant === 'urgent'
        ? styles.highlightSectionUrgent
        : undefined;

  return (
    <section
      ref={sectionRef}
      className={cn(
        styles.highlightSection,
        variantClassName,
        isVisible && styles.highlightSectionVisible,
        className
      )}
    >
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

