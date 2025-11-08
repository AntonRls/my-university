using HacatonMax.University.Events.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.GetUniversityEventTags;

public record GetUniversityEventTagsCommand : IRequest<List<TagDto>>;
