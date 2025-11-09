using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetMyReservations;

public record GetMyReservationsCommand : IRequest<List<ReservationDto>>;
