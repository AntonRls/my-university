export type { EventSortOrder, EventTag, UniversityEvent } from '@api/event';
export { mockEvents } from './mocks/events';
export {
  formatEventDay,
  formatEventDateTime,
  formatEventDuration,
  formatEventPeriod,
  formatEventTimeRange,
  formatEventWeekday,
  formatParticipantsLimit,
  formatParticipantsStatus,
  isEventInPast,
} from './lib/format';
export { sortEventsByStartDate } from './lib/sort';
export { mapEventsTagDto, mapUniversityEventDto, mapUniversityEventList } from './lib/map';
