import type { EventSortOrder, UniversityEvent } from '@api/event';

export function sortEventsByStartDate(
  events: ReadonlyArray<UniversityEvent>,
  order: EventSortOrder,
): UniversityEvent[] {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstTime = new Date(firstEvent.startDateTime).getTime();
    const secondTime = new Date(secondEvent.startDateTime).getTime();

    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
      return 0;
    }

    return order === 'desc' ? secondTime - firstTime : firstTime - secondTime;
  });
}

