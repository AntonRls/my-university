using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetFavoriteBooks;

public class GetFavoriteBooksHandler : IRequestHandler<GetFavoriteBooksCommand, List<BookDto>>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public GetFavoriteBooksHandler(IBookRepository bookRepository, IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task<List<BookDto>> Handle(GetFavoriteBooksCommand request, CancellationToken cancellationToken)
    {
        var favoriteBooks = await _bookRepository.GetFavoritesBook(_userContextService.GetCurrentUser().Id);

        return favoriteBooks.Select(x => new BookDto(
            x.Id, x.Title, x.Description, x.Count, x.TakeCount, true, x.Author,
            x.Tags.Select(x => new TagDto(x.Id, x.Name)).ToList())).ToList();
    }
}
