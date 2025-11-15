using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBookReservations;

public record GetBookReservationsCommand(long BookId) : IRequest<List<BookReservationDto>>;

