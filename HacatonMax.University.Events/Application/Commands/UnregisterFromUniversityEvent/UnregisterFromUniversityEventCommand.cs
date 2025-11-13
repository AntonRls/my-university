using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.UnregisterFromUniversityEvent;

public readonly record struct UnregisterFromUniversityEventCommand(long EventId) : IRequest<UniversityEventDto>;

