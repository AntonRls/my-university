using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ReservationBook;

public record ReservationBookCommand(long BookId) : IRequest;
