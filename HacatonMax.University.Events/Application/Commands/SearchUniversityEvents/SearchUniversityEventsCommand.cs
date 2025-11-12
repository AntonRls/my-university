using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.SearchUniversityEvents;

public sealed record SearchUniversityEventsCommand(string Query) : IRequest<List<UniversityEventDto>>;

