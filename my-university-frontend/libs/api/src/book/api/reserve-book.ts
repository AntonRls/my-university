/// <reference lib="dom" />
import type { ReservationDto } from '@api/services/reservations-api-service';
import { reservationsApiService } from '@api/services';

type BookIdentifier = string | number;

type ReservationRequestOptions = {
  bookId: BookIdentifier;
  signal?: AbortSignal;
};

function normalizeBookId(bookId: BookIdentifier): number {
  if (typeof bookId === 'number') {
    return bookId;
  }

  const parsedId = Number.parseInt(bookId, 10);

  if (Number.isNaN(parsedId)) {
    throw new Error('[reservations] Invalid book identifier provided');
  }

  return parsedId;
}

export function reserveBook({ bookId, signal }: ReservationRequestOptions): Promise<void> {
  return reservationsApiService.reserveBook({
    bookId: normalizeBookId(bookId),
    signal,
  });
}

export function cancelReservation({ bookId, signal }: ReservationRequestOptions): Promise<void> {
  return reservationsApiService.cancelReservation({
    bookId: normalizeBookId(bookId),
    signal,
  });
}

export function extendReservation({ bookId, signal }: ReservationRequestOptions): Promise<void> {
  return reservationsApiService.extendReservation({
    bookId: normalizeBookId(bookId),
    signal,
  });
}

export function fetchStudentReservations(signal?: AbortSignal): Promise<ReadonlyArray<ReservationDto>> {
  return reservationsApiService.getStudentReservations(signal);
}

