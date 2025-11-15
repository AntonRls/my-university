/// <reference lib="dom" />
import type { LibraryTagDto } from '@api/services/books-api-service';
import { booksApiService } from '@api/services';

export function fetchBookTags(signal?: AbortSignal): Promise<ReadonlyArray<LibraryTagDto>> {
  return booksApiService.getTags(signal);
}


