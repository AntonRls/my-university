import type {
  BookDto,
  SearchBooksParams,
  SearchBooksResponse,
} from '@api/services/books-api-service';
import { booksApiService } from '@api/services';

export type SearchBooksResult = SearchBooksResponse & {
  books: ReadonlyArray<BookDto>;
};

export function searchBooks(params: SearchBooksParams): Promise<SearchBooksResult> {
  return booksApiService.searchBooks(params);
}

