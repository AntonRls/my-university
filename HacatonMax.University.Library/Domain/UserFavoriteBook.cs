namespace HacatonMax.University.Library.Domain;

public class UserFavoriteBook
{
    public UserFavoriteBook(long userId, long bookId)
    {
        UserId = userId;
        BookId = bookId;
    }

    public long UserId { get; private set; }

    public long BookId { get; private set; }
}
