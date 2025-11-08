using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEvents;

public record GetUniversityEventsCommand(List<Guid>? TagIds = null) : IRequest<List<UniversityEventDto>>;
