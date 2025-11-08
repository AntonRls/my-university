using HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;
using HacatonMax.University.Events.Application.Commands.GetUniversityEvents;
using HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;
using HacatonMax.University.Events.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Controllers;

[ApiController]
[Route("university-events")]
public class UniversityEventsController(IMediator mediator)
{
    [HttpPost]
    public Task CreateUniversityEvent(CreateUniversityEventCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet]
    public Task<List<UniversityEventDto>> GetUniversityEvent([FromQuery] GetUniversityEventsCommand command)
    {
        return mediator.Send(command);
    }

    [HttpGet("tags")]
    public Task<List<TagDto>> GetTagsUniversityEvent()
    {
        return mediator.Send(new GetUniversityEventTagsCommand());
    }
}
