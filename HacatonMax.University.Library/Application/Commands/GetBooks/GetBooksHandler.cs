using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBooks;

public class GetBooksHandler : IRequestHandler<GetBooksCommand, List<BookDto>>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public GetBooksHandler(IBookRepository bookRepository, IUserContextService  userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task<List<BookDto>> Handle(GetBooksCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();

        var books = await _bookRepository.Get(request.Tags);
        var favoriteBooks = await _bookRepository.GetUserFavoriteBookIds(user.Id);

        return books.Select(x => new BookDto(
            x.Id,
            x.Title,
            x.Description,
            x.Count,
            x.TakeCount,
            favoriteBooks.Contains(x.Id),
            x.Author,
            x.Tags.Select(tag => new TagDto(tag.Id, tag.Name)).ToList()))
            .ToList();
    }
}
