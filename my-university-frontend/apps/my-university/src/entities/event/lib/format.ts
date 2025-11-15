import type { UniversityEvent } from '@api/event';

const dayFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const dayWithYearFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function parseDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatEventPeriod(startIso: string, endIso: string): string {
  const startDate = parseDate(startIso);
  const endDate = parseDate(endIso);

  if (!startDate || !endDate) {
    return '';
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();
  const startTime = timeFormatter.format(startDate);

  if (sameDay) {
    return formatEventTimeRange(startIso, endIso);
  }

  const startDayLabel = formatEventDay(startIso);
  const endDayLabel = formatEventDay(endIso);
  const endTime = timeFormatter.format(endDate);
  return `${startDayLabel}, ${startTime} — ${endDayLabel}, ${endTime}`;
}

export function formatEventDay(isoDate: string): string {
  const date = parseDate(isoDate);

  if (!date) {
    return '';
  }

  const now = new Date();
  const formatter = date.getFullYear() === now.getFullYear() ? dayFormatter : dayWithYearFormatter;
  return capitalizeFirstLetter(formatter.format(date));
}

export function formatEventWeekday(isoDate: string): string {
  const date = parseDate(isoDate);

  if (!date) {
    return '';
  }

  return capitalizeFirstLetter(weekdayFormatter.format(date));
}

export function formatEventTimeRange(startIso: string, endIso: string): string {
  const startDate = parseDate(startIso);
  const endDate = parseDate(endIso);

  if (!startDate) {
    return '';
  }

  const startTime = timeFormatter.format(startDate);

  if (!endDate) {
    return startTime;
  }

  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    const endTime = timeFormatter.format(endDate);
    return `${startTime} – ${endTime}`;
  }

  const endDayLabel = formatEventDay(endIso);
  const endTime = timeFormatter.format(endDate);
  return `${startTime} — ${endDayLabel} ${endTime}`;
}

export function formatEventDateTime(isoDate: string): string {
  const date = parseDate(isoDate);

  if (!date) {
    return '';
  }

  return capitalizeFirstLetter(dateTimeFormatter.format(date));
}

export function formatEventDuration(startIso: string, endIso: string): string {
  const startDate = parseDate(startIso);
  const endDate = parseDate(endIso);

  if (!startDate || !endDate) {
    return '';
  }

  const diffMs = endDate.getTime() - startDate.getTime();

  if (diffMs <= 0) {
    return 'Менее минуты';
}

  const totalMinutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${getHoursWord(hours)}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${getMinutesWord(minutes)}`);
  }

  if (parts.length === 0) {
    return 'Менее минуты';
  }

  return parts.join(' ');
}

export function formatParticipantsLimit(limit: number | null): string {
  if (limit === null) {
    return 'Без ограничений';
  }

  const safeLimit = Math.max(0, limit);
  return `До ${safeLimit} ${getParticipantsWord(safeLimit)}`;
}

export function formatParticipantsStatus(registeredCount: number, limit: number | null): string {
  const safeRegistered = Math.max(0, registeredCount);

  if (limit === null) {
    return `${safeRegistered} ${getParticipantsWord(safeRegistered)} (без ограничений)`;
  }

  const safeLimit = Math.max(0, limit);
  const limitWord = getParticipantsWord(safeLimit);

  if (safeRegistered >= safeLimit) {
    return `${safeRegistered} из ${safeLimit} ${limitWord} (лимит достигнут)`;
  }

  return `${safeRegistered} из ${safeLimit} ${limitWord}`;
}

export function isEventInPast(event: UniversityEvent): boolean {
  const endDate = parseDate(event.endDateTime);

  if (!endDate) {
    return false;
  }

  return endDate.getTime() < Date.now();
}

function getHoursWord(value: number): string {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'часов';
  }

  if (lastDigit === 1) {
    return 'час';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'часа';
  }

  return 'часов';
}

function getMinutesWord(value: number): string {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'минут';
  }

  if (lastDigit === 1) {
    return 'минута';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'минуты';
  }

  return 'минут';
}

function getParticipantsWord(value: number): string {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'участников';
  }

  if (lastDigit === 1) {
    return 'участника';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'участников';
  }

  return 'участников';
}

function capitalizeFirstLetter(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

