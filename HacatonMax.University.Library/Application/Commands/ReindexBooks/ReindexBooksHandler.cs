using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ReindexBooks;

public sealed class ReindexBooksHandler : IRequestHandler<ReindexBooksCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IBookSearchService _bookSearchService;

    public ReindexBooksHandler(
        IBookRepository bookRepository,
        IBookSearchService bookSearchService)
    {
        _bookRepository = bookRepository;
        _bookSearchService = bookSearchService;
    }

    public async Task Handle(ReindexBooksCommand request, CancellationToken cancellationToken)
    {
        var books = await _bookRepository.Get();

        if (books.Count == 0)
        {
            return;
        }

        await _bookSearchService.IndexMany(books);
    }
}

