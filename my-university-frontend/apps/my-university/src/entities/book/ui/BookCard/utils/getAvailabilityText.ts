export function getAvailabilityText(availableCount: number): string {
  if (availableCount === 0) {
    return 'Нет в наличии';
  }

  if (availableCount === 1) {
    return '1 книга';
  }

  if (availableCount < 5) {
    return `${availableCount} книги`;
  }

  return `${availableCount} книг`;
}

