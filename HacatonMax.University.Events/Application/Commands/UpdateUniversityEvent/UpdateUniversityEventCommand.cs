using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.UpdateUniversityEvent;

public record UpdateUniversityEventCommand(
    long EventId,
    string Title,
    string Description,
    string Location,
    long? ParticipantsLimit,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    List<TagDto> Tags) : IRequest;

