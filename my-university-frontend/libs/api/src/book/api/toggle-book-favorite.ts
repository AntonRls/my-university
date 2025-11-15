/// <reference lib="dom" />
import type { ToggleFavoriteParams } from '@api/services/books-api-service';
import { booksApiService } from '@api/services';

type ToggleBookFavoriteOptions = ToggleFavoriteParams & { bookId: number };

type ToggleBookFavoriteInput = {
  bookId: number | string;
  signal?: AbortSignal;
};

function normalizeParams({ bookId, signal }: ToggleBookFavoriteInput): ToggleBookFavoriteOptions {
  if (typeof bookId === 'number') {
    return { bookId, signal };
  }

  const numericId = Number.parseInt(bookId, 10);

  if (Number.isNaN(numericId)) {
    throw new Error('[books] Invalid book identifier provided');
  }

  return { bookId: numericId, signal };
}

export function toggleBookFavorite(options: ToggleBookFavoriteInput): Promise<void> {
  return booksApiService.toggleFavorite(normalizeParams(options));
}


