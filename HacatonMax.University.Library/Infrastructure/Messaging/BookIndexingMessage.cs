namespace HacatonMax.University.Library.Infrastructure.Messaging;

internal enum BookIndexingAction
{
    Index = 1,
    Remove = 2
}

internal sealed record BookIndexingMessage(
    long BookId,
    BookIndexingAction Action);

