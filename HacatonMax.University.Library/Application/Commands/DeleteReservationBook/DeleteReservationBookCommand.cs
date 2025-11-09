using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.DeleteReservationBook;

public record DeleteReservationBookCommand(long BookId) : IRequest;
