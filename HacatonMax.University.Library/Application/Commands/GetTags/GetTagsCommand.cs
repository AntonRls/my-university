using HacatonMax.University.Library.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetTags;

public record GetTagsCommand : IRequest<List<TagDto>>;
