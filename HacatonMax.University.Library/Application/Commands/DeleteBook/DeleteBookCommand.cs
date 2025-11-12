using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.DeleteBook;

public record DeleteBookCommand(long BookId) : IRequest;

