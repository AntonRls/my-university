using System.Collections.Generic;

namespace HacatonMax.University.Library.Domain;

public interface IBookSearchService
{
    Task EnsureIndex();

    Task<bool> Index(Book book);

    Task IndexMany(IReadOnlyCollection<Book> books);

    Task<bool> Remove(long bookId);

    Task<BookSearchResult> Search(BookSearchRequest request);
}

