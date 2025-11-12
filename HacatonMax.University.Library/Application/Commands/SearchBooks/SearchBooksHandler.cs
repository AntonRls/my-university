using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.SearchBooks;

public sealed class SearchBooksHandler : IRequestHandler<SearchBooksCommand, SearchBooksResponseDto>
{
    private const int MaxPageSize = 50;

    private readonly IBookRepository _bookRepository;
    private readonly IBookSearchService _bookSearchService;
    private readonly IUserContextService _userContextService;

    public SearchBooksHandler(
        IBookRepository bookRepository,
        IBookSearchService bookSearchService,
        IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _bookSearchService = bookSearchService;
        _userContextService = userContextService;
    }

    public async Task<SearchBooksResponseDto> Handle(SearchBooksCommand request, CancellationToken cancellationToken)
    {
        var query = request.Query?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(query))
        {
            throw new BadRequestException("Запрос для поиска не может быть пустым");
        }

        var page = request.Page <= 0 ? 1 : request.Page;
        var pageSize = request.PageSize <= 0 ? 20 : Math.Min(request.PageSize, MaxPageSize);

        var searchResult = await _bookSearchService.Search(new BookSearchRequest(
            query,
            request.Tags,
            page,
            pageSize));

        var currentUser = _userContextService.GetCurrentUser();
        var favoriteBooks = await _bookRepository.GetUserFavoriteBookIds(currentUser.Id);

        var books = searchResult.Items
            .Select(book => new BookDto(
                book.Id,
                book.Title,
                book.Description,
                book.Count,
                book.TakeCount,
                favoriteBooks.Contains(book.Id),
                book.Author,
                book.Tags.Select(tag => new TagDto(tag.Id, tag.Name)).ToList()))
            .ToList();

        return new SearchBooksResponseDto(
            searchResult.Total,
            searchResult.Page,
            searchResult.PageSize,
            books);
    }
}

