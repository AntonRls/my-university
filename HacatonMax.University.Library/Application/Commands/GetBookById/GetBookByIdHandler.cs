using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBookById;

public class GetBookByIdHandler : IRequestHandler<GetBookByIdCommand, BookDto>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public GetBookByIdHandler(IBookRepository bookRepository, IUserContextService  userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task<BookDto> Handle(GetBookByIdCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();

        var book = await _bookRepository.GetBookById(request.Id);
        var favoritesBooks = await _bookRepository.GetUserFavoriteBooks(user.Id);
        var favoritesBooksIds = favoritesBooks.Select(x => x.Id).ToHashSet();
        if (book == null)
        {
            throw new NotFoundException($"Книга с ID {request.Id} не найдена");
        }

        return new BookDto(
            book.Id,
            book.Title,
            book.Description,
            book.Count,
            book.TakeCount,
            favoritesBooksIds.Contains(book.Id),
            book.Author,
            book.Tags.Select(x => new TagDto(x.Id, x.Name)).ToList());
    }
}
