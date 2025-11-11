using HacatonMax.University.Library.Application.Commands.DeleteReservationBook;
using HacatonMax.University.Library.Application.Commands.ExtendReservationBook;
using HacatonMax.University.Library.Application.Commands.GetMyReservations;
using HacatonMax.University.Library.Application.Commands.ReservationBook;
using HacatonMax.University.Library.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Controllers;

[ApiController]
[Route("university-library/reservations")]
public class UniversityReservationsController(IMediator mediator)
{
    /// <summary>
    /// Забронировать книгу на 7 дней
    /// </summary>
    [HttpPost("reservations/books/{id:long}")]
    [Authorize]
    public Task ReservationBook([FromRoute] long id)
    {
        return mediator.Send(new ReservationBookCommand(id));
    }

    /// <summary>
    /// Удалить бронирование
    /// </summary>
    [HttpDelete("reservations/books/{id:long}")]
    [Authorize]
    public Task DeleteReservationBook([FromRoute] long id)
    {
        return mediator.Send(new DeleteReservationBookCommand(id));
    }

    /// <summary>
    /// Продлить бронь книги на 7 дней (доступно 3 раза, дальше - ошибка)
    /// </summary>
    [HttpPut("reservations/books/{id:long}/extend")]
    [Authorize]
    public Task ExtendReservationBook([FromRoute] long id)
    {
        return mediator.Send(new ExtendReservationBookCommand(id));
    }

    /// <summary>
    /// Получить все брони текущего пользователя
    /// </summary>
    [HttpGet("reservations/student")]
    [Authorize]
    public Task<List<ReservationDto>> GetMyReservations()
    {
        return mediator.Send(new GetMyReservationsCommand());
    }
}
