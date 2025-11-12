using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.DeleteUniversityEvent;

public record DeleteUniversityEventCommand(long EventId) : IRequest;

