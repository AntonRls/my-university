using HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;
using HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;
using HacatonMax.University.Events.Application.Commands.GetUniversityEvents;
using HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;
using HacatonMax.University.Events.Application.Commands.RegisterForUniversityEvent;
using HacatonMax.University.Events.Application.Commands.SearchUniversityEvents;
using HacatonMax.University.Events.Application.Commands.UnregisterFromUniversityEvent;
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
            request.Location,
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

    [HttpGet("search")]
    [Authorize]
    public Task<List<UniversityEventDto>> SearchUniversityEvents([FromQuery] string query)
    {
        return mediator.Send(new SearchUniversityEventsCommand(query));
    }

    [HttpPost("{id:long}/registrations")]
    [Authorize]
    public Task<UniversityEventDto> RegisterForUniversityEvent([FromRoute] long id)
    {
        return mediator.Send(new RegisterForUniversityEventCommand(id));
    }

    [HttpDelete("{id:long}/registrations")]
    [Authorize]
    public Task<UniversityEventDto> UnregisterFromUniversityEvent([FromRoute] long id)
    {
        return mediator.Send(new UnregisterFromUniversityEventCommand(id));
    }
}
