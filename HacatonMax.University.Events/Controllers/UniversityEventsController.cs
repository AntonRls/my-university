using HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;
using HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;
using HacatonMax.University.Events.Application.Commands.GetUniversityEvents;
using HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;
using HacatonMax.University.Events.Application.Commands.UpdateUniversityEvent;
using HacatonMax.University.Events.Controllers.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Controllers;

[ApiController]
[Route("university-events")]
public class UniversityEventsController(IMediator mediator)
{
    [HttpPost]
    // TODO: Раскомментировать проверку авторизации после настройки получения токена
    // [Authorize]
    public Task CreateUniversityEvent(CreateUniversityEventCommand command)
    {
        return mediator.Send(command);
    }

    [HttpPut("{id:long}")]
    [Authorize]
    public Task UpdateUniversityEvent([FromRoute] long id, [FromBody] UpdateUniversityEventRequestDto request)
    {
        return mediator.Send(new UpdateUniversityEventCommand(
            id,
            request.Title,
            request.Description,
            request.ParticipantsLimit,
            request.StartDateTime,
            request.EndDateTime,
            request.Tags));
    }

    [HttpDelete("{id:long}")]
    [Authorize]
    public Task DeleteUniversityEvent([FromRoute] long id)
    {
        return mediator.Send(new DeleteUniversityEventCommand(id));
    }

    [HttpGet]
    [Authorize]
    public Task<List<UniversityEventDto>> GetUniversityEvent([FromQuery] GetUniversityEventsCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet("tags")]
    [Authorize]
    public Task<List<TagDto>> GetTagsUniversityEvent()
    {
        return mediator.Send(new GetUniversityEventTagsCommand());
    }
}
