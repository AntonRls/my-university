using HacatonMax.Common.Exceptions;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.DeleteBook;

public sealed class DeleteBookHandler : IRequestHandler<DeleteBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IBookIndexingPublisher _bookIndexingPublisher;

    public DeleteBookHandler(
        IBookRepository bookRepository,
        IBookIndexingPublisher bookIndexingPublisher)
    {
        _bookRepository = bookRepository;
        _bookIndexingPublisher = bookIndexingPublisher;
    }

    public async Task Handle(DeleteBookCommand request, CancellationToken cancellationToken)
    {
        var book = await _bookRepository.GetBookById(request.BookId);

        if (book == null)
        {
            throw new NotFoundException($"Книга с ID {request.BookId} не найдена");
        }

        await _bookRepository.DeleteBook(book);
        await _bookIndexingPublisher.PublishRemove(book.Id, cancellationToken);
    }
}

