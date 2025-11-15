using HacatonMax.University.Schedule.Application.Commands.CreateGroupLesson;
using HacatonMax.University.Schedule.Application.Commands.DeleteGroupLesson;
using HacatonMax.University.Schedule.Application.Commands.UpdateGroupLesson;
using HacatonMax.University.Schedule.Application.Queries.GetGroupSchedule;
using HacatonMax.University.Schedule.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Schedule.Controllers;

[ApiController]
[Route("schedule/groups")]
[Authorize]
public class GroupScheduleController(IMediator mediator) : ControllerBase
{
    [HttpGet("{groupId:long}")]
    public Task<List<ScheduleEntryDto>> GetGroupSchedule([FromRoute] long groupId, [FromQuery] ScheduleFiltersDto filters)
    {
        return mediator.Send(new GetGroupScheduleQuery(groupId, filters.From, filters.To, filters.DeliveryType));
    }

    [HttpPost("{groupId:long}/lessons")]
    public Task<long> CreateLesson([FromRoute] long groupId, [FromBody] GroupLessonRequestDto request)
    {
        var command = new CreateGroupLessonCommand(
            groupId,
            request.Title,
            request.Description,
            request.Teacher,
            request.DeliveryType,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt);

        return mediator.Send(command);
    }

    [HttpPut("{groupId:long}/lessons/{entryId:long}")]
    public Task UpdateLesson([FromRoute] long groupId, [FromRoute] long entryId, [FromBody] GroupLessonRequestDto request)
    {
        var command = new UpdateGroupLessonCommand(
            entryId,
            groupId,
            request.Title,
            request.Description,
            request.Teacher,
            request.DeliveryType,
            request.PhysicalLocation,
            request.OnlineLink,
            request.StartsAt,
            request.EndsAt);

        return mediator.Send(command);
    }

    [HttpDelete("{groupId:long}/lessons/{entryId:long}")]
    public Task DeleteLesson([FromRoute] long groupId, [FromRoute] long entryId)
    {
        return mediator.Send(new DeleteGroupLessonCommand(entryId, groupId));
    }
}

