using HacatonMax.University.Deadlines.Application.Commands.CompleteDeadline;
using HacatonMax.University.Deadlines.Application.Commands.CreateDeadline;
using HacatonMax.University.Deadlines.Application.Commands.DeleteDeadline;
using HacatonMax.University.Deadlines.Application.Commands.SyncDeadlineDueDate;
using HacatonMax.University.Deadlines.Application.Commands.UpdateDeadline;
using HacatonMax.University.Deadlines.Application.Models;
using HacatonMax.University.Deadlines.Application.Queries.GetDeadlineDetails;
using HacatonMax.University.Deadlines.Application.Queries.GetGroupDeadlines;
using HacatonMax.University.Deadlines.Application.Queries.GetMyDeadlines;
using HacatonMax.University.Deadlines.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Controllers;

[ApiController]
[Route("deadlines")]
[Authorize]
public sealed class DeadlinesController(IMediator mediator) : ControllerBase
{
    [HttpGet("me")]
    public Task<IReadOnlyCollection<DeadlineDto>> GetMyDeadlines([FromQuery] bool onlyActive = true)
    {
        return mediator.Send(new GetMyDeadlinesQuery(onlyActive));
    }

    [HttpGet("groups/{groupId:long}")]
    public Task<IReadOnlyCollection<DeadlineDto>> GetGroupDeadlines([FromRoute] long groupId)
    {
        return mediator.Send(new GetGroupDeadlinesQuery(groupId));
    }

    [HttpGet("{deadlineId:long}")]
    public Task<DeadlineDto> GetDeadline([FromRoute] long deadlineId)
    {
        return mediator.Send(new GetDeadlineDetailsQuery(deadlineId));
    }

    [HttpPost("groups/{groupId:long}")]
    public Task<long> CreateDeadline([FromRoute] long groupId, [FromBody] CreateDeadlineRequestDto request)
    {
        var command = new CreateDeadlineCommand(
            groupId,
            request.Title,
            request.DescriptionHtml,
            request.DueAt,
            request.AccessScope,
            request.ScheduleEntryId);

        return mediator.Send(command);
    }

    [HttpPut("{deadlineId:long}")]
    public Task UpdateDeadline([FromRoute] long deadlineId, [FromBody] UpdateDeadlineRequestDto request)
    {
        var command = new UpdateDeadlineCommand(
            deadlineId,
            request.Title,
            request.DescriptionHtml,
            request.DueAt,
            request.AccessScope,
            request.ScheduleEntryId);

        return mediator.Send(command);
    }

    [HttpDelete("{deadlineId:long}")]
    public Task DeleteDeadline([FromRoute] long deadlineId)
    {
        return mediator.Send(new DeleteDeadlineCommand(deadlineId));
    }

    [HttpPost("{deadlineId:long}/complete")]
    public Task CompleteDeadline([FromRoute] long deadlineId)
    {
        return mediator.Send(new CompleteDeadlineCommand(deadlineId));
    }

    [HttpPost("{deadlineId:long}/link-schedule")]
    public Task LinkDeadlineToSchedule([FromRoute] long deadlineId, [FromBody] SyncDeadlineScheduleRequestDto request)
    {
        var command = new SyncDeadlineDueDateCommand(deadlineId, request.ScheduleEntryId);
        return mediator.Send(command);
    }
}


