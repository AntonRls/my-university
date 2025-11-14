using HacatonMax.University.Admin.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.GetUsersByIds;

public record GetUsersByIdsCommand(long[]? UserIds) : IRequest<List<UserDto>>;
