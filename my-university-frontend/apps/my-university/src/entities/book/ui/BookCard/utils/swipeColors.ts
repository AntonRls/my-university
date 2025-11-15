const MAX_SWIPE_OFFSET = 120;

const ORDER_COLOR = { r: 55, g: 182, b: 233 };
const BOOKMARK_COLOR = { r: 255, g: 152, b: 0 };
const DELETE_COLOR = { r: 255, g: 99, b: 99 };
const SUCCESS_COLOR = { r: 34, g: 182, b: 75 };

type SwipeDirection = 'left' | 'right' | null;

type GetSwipeColorOptions = {
  swipeDirection: SwipeDirection;
  swipeOffset: number;
  isEmpty: boolean;
  isBookmarked: boolean;
  isOrdered: boolean;
};

export function getSwipeColor({
  swipeDirection,
  swipeOffset,
  isEmpty,
  isBookmarked,
  isOrdered,
}: GetSwipeColorOptions): string | undefined {
  const progress = Math.min(Math.abs(swipeOffset) / MAX_SWIPE_OFFSET, 1);

  if (progress === 0) {
    return undefined;
  }

  let baseColor: { r: number; g: number; b: number };
  let targetColor: { r: number; g: number; b: number };

  if (swipeDirection === 'right') {
    if (isEmpty) {
      baseColor = DELETE_COLOR;
      targetColor = DELETE_COLOR;
    } else if (isOrdered) {
      baseColor = ORDER_COLOR;
      targetColor = DELETE_COLOR;
    } else {
      baseColor = ORDER_COLOR;
      targetColor = SUCCESS_COLOR;
    }
  } else if (swipeDirection === 'left') {
    if (isBookmarked) {
      baseColor = BOOKMARK_COLOR;
      targetColor = DELETE_COLOR;
    } else {
      baseColor = BOOKMARK_COLOR;
      targetColor = SUCCESS_COLOR;
    }
  } else {
    return undefined;
  }

  const colorProgress = progress < 0.5 ? 0 : (progress - 0.5) / 0.5;

  const r = Math.round(baseColor.r + (targetColor.r - baseColor.r) * colorProgress);
  const g = Math.round(baseColor.g + (targetColor.g - baseColor.g) * colorProgress);
  const b = Math.round(baseColor.b + (targetColor.b - baseColor.b) * colorProgress);

  return `rgb(${r} ${g} ${b} / 78%)`;
}

