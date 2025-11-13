using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.RegisterForUniversityEvent;

public readonly record struct RegisterForUniversityEventCommand(long EventId) : IRequest<UniversityEventDto>;

