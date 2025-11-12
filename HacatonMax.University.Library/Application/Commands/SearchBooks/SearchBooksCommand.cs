using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.SearchBooks;

public sealed record SearchBooksCommand(
    string Query,
    List<Guid>? Tags = null,
    int Page = 1,
    int PageSize = 20) : IRequest<SearchBooksResponseDto>;

