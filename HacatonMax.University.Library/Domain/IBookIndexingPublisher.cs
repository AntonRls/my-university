namespace HacatonMax.University.Library.Domain;

public interface IBookIndexingPublisher
{
    Task PublishIndex(long bookId, CancellationToken cancellationToken = default);

    Task PublishRemove(long bookId, CancellationToken cancellationToken = default);
}

