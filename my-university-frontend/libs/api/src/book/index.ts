// Export types
export type { Book } from './model/book';

// Export API functions
export {
  reserveBook,
  cancelReservation,
  extendReservation,
  fetchStudentReservations,
  bookmarkBook,
  unbookmarkBook,
  fetchBooks,
  fetchBookTags,
  toggleBookFavorite,
  searchBooks,
} from './api';
