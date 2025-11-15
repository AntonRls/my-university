import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

import { cancelReservation, reserveBook, toggleBookFavorite } from '@api/book';

type UseBookActionsOptions = {
  bookId: string;
  isEmpty: boolean;
  initialBookmarked?: boolean;
  initialOrdered?: boolean;
  // eslint-disable-next-line no-unused-vars
  onBookmarkChange?: (isFavorite: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  onReservationChange?: (isReserved: boolean) => void;
};

type UseBookActionsReturn = {
  isBookmarked: boolean;
  isOrdered: boolean;
  isProcessing: boolean;
  handleBookmark: () => Promise<void>;
  handleOrder: () => Promise<void>;
};

export function useBookActions({
  bookId,
  isEmpty,
  initialBookmarked = false,
  initialOrdered = false,
  onBookmarkChange,
  onReservationChange,
}: UseBookActionsOptions): UseBookActionsReturn {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isOrdered, setIsOrdered] = useState(initialOrdered);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  const handleBookmark = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const nextState = !isBookmarked;
      await toggleBookFavorite({ bookId });
      setIsBookmarked(nextState);
      onBookmarkChange?.(nextState);
      toast.success(nextState ? 'Книга добавлена в избранное' : 'Книга удалена из избранного');
    } catch (error) {
      console.error('[book] bookmark error:', error);
      toast.error('Не удалось обновить избранное');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [bookId, isBookmarked, onBookmarkChange]);

  const handleOrder = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    if (!isOrdered && isEmpty) {
      toast.info('Все экземпляры книги заняты');
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      if (isOrdered) {
        await cancelReservation({ bookId });
        setIsOrdered(false);
        onReservationChange?.(false);
        toast.success('Заказ отменен');
      } else {
        await reserveBook({ bookId });
        setIsOrdered(true);
        onReservationChange?.(true);
        toast.success('Книга успешно заказана');
      }
    } catch (error) {
      console.error('[book] order error:', error);
      toast.error('Не удалось выполнить действие');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, [bookId, isEmpty, isOrdered, onReservationChange]);

  return {
    isBookmarked,
    isOrdered,
    isProcessing,
    handleBookmark,
    handleOrder,
  };
}

