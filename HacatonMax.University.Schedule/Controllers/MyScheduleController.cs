using HacatonMax.University.Schedule.Application.Commands.RemovePersonalSlot;
using HacatonMax.University.Schedule.Application.Commands.UpsertPersonalSlot;
using HacatonMax.University.Schedule.Application.Queries.GetMySchedule;
using HacatonMax.University.Schedule.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Controllers;

[ApiController]
[Route("schedule/me")]
[Authorize]
public class MyScheduleController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public Task<List<ScheduleEntryDto>> GetMySchedule([FromQuery] ScheduleFiltersDto filters)
    {
        return mediator.Send(new GetMyScheduleQuery(filters.From, filters.To, filters.DeliveryType));
    }

    [HttpPost("slots")]
    public Task<long> CreatePersonalSlot([FromBody] PersonalSlotRequestDto request)
    {
        return mediator.Send(new UpsertPersonalSlotCommand(
            null,
            request.Title,
            request.Description,
            request.Teacher,
            request.DeliveryType,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt));
    }

    [HttpPut("slots/{entryId:long}")]
    public Task<long> UpdatePersonalSlot([FromRoute] long entryId, [FromBody] PersonalSlotRequestDto request)
    {
        return mediator.Send(new UpsertPersonalSlotCommand(
            entryId,
            request.Title,
            request.Description,
            request.Teacher,
            request.DeliveryType,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt));
    }

    [HttpDelete("slots/{entryId:long}")]
    public Task RemovePersonalSlot([FromRoute] long entryId)
    {
        return mediator.Send(new RemovePersonalSlotCommand(entryId));
    }
}

