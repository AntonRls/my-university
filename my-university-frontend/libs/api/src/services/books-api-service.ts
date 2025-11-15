/// <reference lib="dom" />
import { apiGet, apiRequest } from '@api/shared/api/api-client';

export type LibraryTagDto = {
  id: string;
  name: string | null;
};

export type BookDto = {
  id: number;
  title: string | null;
  description: string | null;
  author?: string | null;
  count: number;
  take_count: number;
  is_favorite: boolean;
  tags: ReadonlyArray<LibraryTagDto> | null;
};

export type GetBooksParams = {
  tagIds?: ReadonlyArray<string>;
  signal?: AbortSignal;
};

export type ToggleFavoriteParams = {
  bookId: number;
  signal?: AbortSignal;
};

export type SearchBooksParams = {
  query: string;
  tagIds?: ReadonlyArray<string>;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

export type SearchBooksResponse = {
  total: number;
  page: number;
  page_size: number;
  books: ReadonlyArray<BookDto>;
};

class BooksApiService {
  async getBooks(params: GetBooksParams = {}): Promise<ReadonlyArray<BookDto>> {
    const { tagIds, signal } = params;
    let path = '/university-library/books';

    if (tagIds && tagIds.length > 0) {
      const searchParams = new URLSearchParams();

      tagIds.forEach((tagId) => {
        searchParams.append('Tags', tagId);
      });

      path = `${path}?${searchParams.toString()}`;
    }

    return apiGet<ReadonlyArray<BookDto>>(path, { signal });
  }

  async toggleFavorite(params: ToggleFavoriteParams): Promise<void> {
    const { bookId, signal } = params;
    await apiRequest<void, undefined>(`/university-library/books/${bookId}/favorite`, {
      method: 'PUT',
      signal,
    });
  }

  async getTags(signal?: AbortSignal): Promise<ReadonlyArray<LibraryTagDto>> {
    return apiGet<ReadonlyArray<LibraryTagDto>>('/university-library/books/tags', { signal });
  }

  async createTag(params: CreateTagParams): Promise<LibraryTagDto> {
    const { name, signal } = params;
    return apiRequest<LibraryTagDto, { name: string }>(
      '/university-library/books/tags',
      {
        method: 'POST',
        body: { name },
        signal,
      },
    );
  }

  async getBookById(params: GetBookByIdParams): Promise<BookDto> {
    const { bookId, signal } = params;
    return apiGet<BookDto>(`/university-library/books/${bookId}`, { signal });
  }

  async searchBooks(params: SearchBooksParams): Promise<SearchBooksResponse> {
    const {
      query,
      tagIds,
      page = 1,
      pageSize = 20,
      signal,
    } = params;

    const payload: {
      query: string;
      tags?: ReadonlyArray<string>;
      page: number;
      page_size: number;
    } = {
      query,
      page,
      page_size: pageSize,
    };

    if (tagIds && tagIds.length > 0) {
      payload.tags = tagIds;
    }

    return apiRequest<SearchBooksResponse, typeof payload>(
      '/university-library/books/search',
      {
        method: 'POST',
        body: payload,
        signal,
      },
    );
  }

  async createBook(params: CreateBookParams): Promise<void> {
    const { title, description, author, count, tags, signal } = params;

    const payload: {
      title: string;
      description?: string | null;
      author?: string | null;
      count: number;
      tags: ReadonlyArray<{ id: string; name: string | null }>;
    } = {
      title,
      count,
      tags,
    };

    if (description !== undefined) {
      payload.description = description || null;
    }

    if (author !== undefined) {
      payload.author = author || null;
    }

    await apiRequest<void, typeof payload>('/university-library/books', {
      method: 'POST',
      body: payload,
      signal,
    });
  }

  async deleteBook(params: DeleteBookParams): Promise<void> {
    const { bookId, signal } = params;
    await apiRequest<void, undefined>(`/university-library/books/${bookId}`, {
      method: 'DELETE',
      signal,
    });
  }
}

export type GetBookByIdParams = {
  bookId: number;
  signal?: AbortSignal;
};

export type CreateBookParams = {
  title: string;
  description?: string;
  author?: string;
  count: number;
  tags: ReadonlyArray<{ id: string; name: string | null }>;
  signal?: AbortSignal;
};

export type DeleteBookParams = {
  bookId: number;
  signal?: AbortSignal;
};

export type CreateTagParams = {
  name: string;
  signal?: AbortSignal;
};

export type BookReservationDto = {
  book_id: number;
  reservation_owner_id: number;
  owner_first_name: string;
  owner_last_name: string;
  owner_username?: string | null;
  owner_email?: string | null;
  end_reservation_date: string;
  count_extend_reservation: number;
};

export type BookReservation = {
  bookId: number;
  reservationOwnerId: number;
  ownerFirstName: string;
  ownerLastName: string;
  ownerUsername?: string | null;
  ownerEmail?: string | null;
  endReservationDate: string;
  countExtendReservation: number;
};

function mapBookReservationDto(dto: BookReservationDto): BookReservation {
  return {
    bookId: dto.book_id,
    reservationOwnerId: dto.reservation_owner_id,
    ownerFirstName: dto.owner_first_name,
    ownerLastName: dto.owner_last_name,
    ownerUsername: dto.owner_username ?? null,
    ownerEmail: dto.owner_email ?? null,
    endReservationDate: dto.end_reservation_date,
    countExtendReservation: dto.count_extend_reservation,
  };
}

export async function fetchBookReservations(
  bookId: number,
  signal?: AbortSignal,
): Promise<ReadonlyArray<BookReservation>> {
  const response = await apiGet<ReadonlyArray<BookReservationDto>>(
    `/university-library/books/${bookId}/reservations`,
    { signal },
  );

  return response.map(mapBookReservationDto);
}

export const booksApiService = new BooksApiService();


