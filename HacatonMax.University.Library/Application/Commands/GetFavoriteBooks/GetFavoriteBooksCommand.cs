using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetFavoriteBooks;

public record GetFavoriteBooksCommand : IRequest<List<BookDto>>;
