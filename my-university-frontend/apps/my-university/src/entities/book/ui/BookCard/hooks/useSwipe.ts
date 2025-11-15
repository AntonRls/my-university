import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MAX_SWIPE_OFFSET = 120;
const SWIPE_THRESHOLD = MAX_SWIPE_OFFSET * 0.98;
const EDGE_THRESHOLD = 20;
const CLICK_SUPPRESSION_THRESHOLD = 8;

type SwipeDirection = 'left' | 'right' | null;

type UseSwipeOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isDisabled?: boolean;
};

type UseSwipeReturn = {
  swipeOffset: number;
  swipeDirection: SwipeDirection;
  isDragging: boolean;
  // eslint-disable-next-line no-unused-vars
  bindCardRef: (element: HTMLElement | null) => void;
  // eslint-disable-next-line no-unused-vars
  handleTouchStart: (event: React.TouchEvent<HTMLElement>) => void;
  // eslint-disable-next-line no-unused-vars
  handleTouchMove: (event: React.TouchEvent<HTMLElement>) => void;
  handleTouchEnd: () => void;
  // eslint-disable-next-line no-unused-vars
  handleMouseDown: (event: React.MouseEvent<HTMLElement>) => void;
  cardStyle: React.CSSProperties;
  consumeClickPrevention: () => boolean;
};

export function useSwipe({ onSwipeLeft, onSwipeRight, isDisabled = false }: UseSwipeOptions): UseSwipeReturn {
  const cardRef = useRef<HTMLElement | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const touchStartXRef = useRef<number | null>(null);
  const mouseStartXRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const shouldPreventClickRef = useRef(false);

  const handleStart = useCallback(
    (clientX: number, element: HTMLElement) => {
      if (isDisabled) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const relativeX = clientX - rect.left;

      if (relativeX < EDGE_THRESHOLD || relativeX > rect.width - EDGE_THRESHOLD) {
        return;
      }

      shouldPreventClickRef.current = false;
      touchStartXRef.current = clientX;
      mouseStartXRef.current = clientX;
      setIsDragging(true);
    },
    [isDisabled],
  );

  const handleMove = useCallback((clientX: number) => {
    const startX = touchStartXRef.current ?? mouseStartXRef.current;
    if (startX === null) {
      return;
    }

    const deltaX = clientX - startX;
    const clampedDeltaX = Math.max(-MAX_SWIPE_OFFSET, Math.min(MAX_SWIPE_OFFSET, deltaX));
    setSwipeOffset(clampedDeltaX);

    if (Math.abs(clampedDeltaX) > 5) {
      setSwipeDirection(clampedDeltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, []);

  const handleEnd = useCallback(() => {
    setSwipeOffset((currentOffset) => {
      const absoluteOffset = Math.abs(currentOffset);

      if (absoluteOffset >= SWIPE_THRESHOLD) {
        if (currentOffset > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }

      if (absoluteOffset >= CLICK_SUPPRESSION_THRESHOLD) {
        shouldPreventClickRef.current = true;
      }

      return 0;
    });
    setSwipeDirection(null);
    touchStartXRef.current = null;
    mouseStartXRef.current = null;
    setIsDragging(false);
  }, [onSwipeLeft, onSwipeRight]);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      const touch = event.touches[0];
      if (touch && cardRef.current) {
        handleStart(touch.clientX, cardRef.current);
      }
    },
    [handleStart],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (touchStartXRef.current === null) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      handleMove(touch.clientX);
    },
    [handleMove],
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (cardRef.current) {
        handleStart(event.clientX, cardRef.current);
      }
    },
    [handleStart],
  );

  const bindCardRef = useCallback((element: HTMLElement | null) => {
    cardRef.current = element;
  }, []);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (mouseStartXRef.current === null) {
        return;
      }

      handleMove(event.clientX);
    };

    const handleGlobalMouseUp = () => {
      if (mouseStartXRef.current !== null) {
        handleEnd();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  useEffect(() => {
    if (!isDisabled) {
      return;
    }

    touchStartXRef.current = null;
    mouseStartXRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSwipeOffset(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSwipeDirection(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDragging(false);
    shouldPreventClickRef.current = false;
  }, [isDisabled]);

  const cardStyle: React.CSSProperties = useMemo(
    () => ({
      transform: `translateX(${swipeOffset}px)`,
      transition: swipeOffset === 0 ? 'transform 200ms ease' : 'none',
    }),
    [swipeOffset],
  );

  const consumeClickPrevention = useCallback(() => {
    if (!shouldPreventClickRef.current) {
      return false;
    }

    shouldPreventClickRef.current = false;
    return true;
  }, []);

  return {
    swipeOffset,
    swipeDirection,
    isDragging,
    bindCardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    cardStyle,
    consumeClickPrevention,
  };
}

