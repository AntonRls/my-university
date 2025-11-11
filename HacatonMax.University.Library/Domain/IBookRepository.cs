namespace HacatonMax.University.Library.Domain;

public interface IBookRepository
{
    Task Save(Book book);

    Task<List<Book>> Get(List<Guid>? targetTags = null);

    Task<List<Tag>> GetTags();

    Task InvertFavoriteBookStatus(long bookId, long userId);

    Task<List<Tag>> ExistsTags(List<Guid> tagIds);

    Task SaveTags(List<Tag> tags);

    Task<HashSet<long>> GetUserFavoriteBooks(long userId);

    Task<ReservationBook> ReservationBook(long bookId, long userId);

    Task<ReservationBook?> GetReservationBook(long bookId, long userId);

    Task SaveChanges();

    Task<Book?> GetBookById(long bookId);

    Task<List<ReservationBook>> GetUserReservations(long userId);

    Task DeleteReservation(long bookId, long userId);
}
