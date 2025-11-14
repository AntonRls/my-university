using HacatonMax.University.Users.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.GetUserById;

public record GetUserByIdCommand(long Id) : IRequest<SimpleUserDto?>;

