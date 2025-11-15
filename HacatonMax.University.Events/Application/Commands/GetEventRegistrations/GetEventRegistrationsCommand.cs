using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetEventRegistrations;

public record GetEventRegistrationsCommand(long EventId) : IRequest<List<EventRegistrationDto>>;

