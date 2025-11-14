using HacatonMax.University.Users.Controllers.Dto;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Application.Commands.CreateOrUpdateUser;

public record CreateOrUpdateUserCommand(
    long Id,
    string FirstName,
    string LastName,
    string? Username = null,
    string? Email = null) : IRequest<UserDto>;

