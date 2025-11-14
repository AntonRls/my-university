using HacatonMax.University.Admin.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Application.GetUsersWhoWaitApprove;

public record GetUsersWhoWaitApproveCommand : IRequest<List<UserDto>>;
