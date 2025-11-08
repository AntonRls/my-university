namespace HacatonMax.University.Library.Domain;

public interface IBookRepository
{
    Task Save(Book book);

    Task<List<Book>> Get(List<Guid>? targetTags = null);

    Task<List<Tag>> GetTags();
}
