using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;

public record CreateUniversityEventCommand(
    string Title,
    string Description,
    string Location,
    long? ParticipantsLimit,
    DateTimeOffset StartDateTime,
    DateTimeOffset EndDateTime,
    List<TagDto> Tags) : IRequest;
