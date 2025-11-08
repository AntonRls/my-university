using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBooks;

public record GetBooksCommand(List<Guid>? Tags = null) : IRequest<List<BookDto>>;
