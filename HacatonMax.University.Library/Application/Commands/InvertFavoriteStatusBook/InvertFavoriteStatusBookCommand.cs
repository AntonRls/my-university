using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.InvertFavoriteStatusBook;

public record InvertFavoriteStatusBookCommand(long BookId) : IRequest;
