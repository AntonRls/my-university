using HacatonMax.University.Library.Application.Commands.ReindexBooks;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Infrastructure.Search;

internal sealed class BookSearchReindexJob(IMediator mediator)
{
    public const string JobId = "library-books-reindex";

    public Task Run()
    {
        return mediator.Send(new ReindexBooksCommand());
    }
}

