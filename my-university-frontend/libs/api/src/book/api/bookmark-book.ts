type BookmarkBookResponse = {
  bookId: string;
  bookmarked: boolean;
  message: string;
};

// TODO: заменить на реальный API вызов, когда бэкенд будет готов
export async function bookmarkBook(bookId: string): Promise<BookmarkBookResponse> {
  // Мок: имитируем задержку сети
  await new Promise((resolve) => {
    window.setTimeout(resolve, 300);
  });

  return {
    bookId,
    bookmarked: true,
    message: 'Книга добавлена в закладки',
  };
}

// TODO: заменить на реальный API вызов, когда бэкенд будет готов
export async function unbookmarkBook(bookId: string): Promise<BookmarkBookResponse> {
  // Мок: имитируем задержку сети
  await new Promise((resolve) => {
    window.setTimeout(resolve, 300);
  });

  return {
    bookId,
    bookmarked: false,
    message: 'Книга удалена из закладок',
  };
}

