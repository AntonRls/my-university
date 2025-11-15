import type { BookDto, GetBooksParams } from '@api/services/books-api-service';
import { booksApiService } from '@api/services';

export function fetchBooks(params?: GetBooksParams): Promise<ReadonlyArray<BookDto>> {
  return booksApiService.getBooks(params);
}


