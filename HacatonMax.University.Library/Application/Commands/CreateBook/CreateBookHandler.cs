using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.CreateBook;

public class CreateBookHandler : IRequestHandler<CreateBookCommand>
{
    private readonly IBookRepository _bookRepository;

    public CreateBookHandler(IBookRepository bookRepository)
    {
        _bookRepository = bookRepository;
    }

    public async Task Handle(CreateBookCommand request, CancellationToken cancellationToken)
    {
        var book = new Book(
            request.Title,
            request.Description,
            request.Count,
            0,
            request.Tags.Select(x => new Tag(x.Id, x.Name)).ToList());

        await _bookRepository.Save(book);
    }
}
