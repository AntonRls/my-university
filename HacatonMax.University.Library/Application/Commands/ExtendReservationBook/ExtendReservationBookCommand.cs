using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ExtendReservationBook;

public record ExtendReservationBookCommand(long BookId) : IRequest;
