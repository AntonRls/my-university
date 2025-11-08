using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBooks;

public class GetBooksHandler : IRequestHandler<GetBooksCommand, List<BookDto>>
{
    private readonly IBookRepository _bookRepository;

    public GetBooksHandler(IBookRepository bookRepository)
    {
        _bookRepository = bookRepository;
    }

    public async Task<List<BookDto>> Handle(GetBooksCommand request, CancellationToken cancellationToken)
    {
        var books = await _bookRepository.Get(request.Tags);
        return books.Select(x => new BookDto(
            x.Id,
            x.Title,
            x.Description,
            x.Count,
            x.TakeCount,
            x.Tags.Select(tag => new TagDto(tag.Id, tag.Name)).ToList()))
            .ToList();
    }
}
