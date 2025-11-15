using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEventById;

public record GetUniversityEventByIdCommand(long Id) : IRequest<UniversityEventDto>;

