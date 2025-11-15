/// <reference lib="dom" />
import { apiGet, apiRequest } from '@api/shared/api/api-client';

import type { BookDto } from './books-api-service';

export type ReservationDto = {
  end_reservation_date: string;
  book: BookDto;
};

type ReservationMutationParams = {
  bookId: number;
  signal?: AbortSignal;
};

class ReservationsApiService {
  async reserveBook({ bookId, signal }: ReservationMutationParams): Promise<void> {
    await apiRequest<void, undefined>(`/university-library/reservations/reservations/books/${bookId}`, {
      method: 'POST',
      signal,
    });
  }

  async cancelReservation({ bookId, signal }: ReservationMutationParams): Promise<void> {
    await apiRequest<void, undefined>(`/university-library/reservations/reservations/books/${bookId}`, {
      method: 'DELETE',
      signal,
    });
  }

  async extendReservation({ bookId, signal }: ReservationMutationParams): Promise<void> {
    await apiRequest<void, undefined>(
      `/university-library/reservations/reservations/books/${bookId}/extend`,
      {
        method: 'PUT',
        signal,
      },
    );
  }

  async getStudentReservations(signal?: AbortSignal): Promise<ReadonlyArray<ReservationDto>> {
    return apiGet<ReadonlyArray<ReservationDto>>(
      '/university-library/reservations/reservations/student',
      { signal },
    );
  }
}

export const reservationsApiService = new ReservationsApiService();


