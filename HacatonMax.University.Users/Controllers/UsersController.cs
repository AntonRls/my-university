using HacatonMax.University.Users.Application.Commands.AddUserToUniversity;
using HacatonMax.University.Users.Application.Commands.CreateOrUpdateUser;
using HacatonMax.University.Users.Application.Commands.GetUserById;
using HacatonMax.University.Users.Application.Commands.RemoveUserFromUniversity;
using HacatonMax.University.Users.Controllers.Dto;
using HacatonMax.University.Users.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Users.Controllers;

[ApiController]
[Route("users")]
public class UsersController(IMediator mediator)
{
    /// <summary>
    /// Получить пользователя по ID
    /// </summary>
    [HttpGet("{id:long}")]
    public Task<UserDto?> GetUserById([FromRoute] long id)
    {
        return mediator.Send(new GetUserByIdCommand(id));
    }

    /// <summary>
    /// Получить всех пользователей по ID университета
    /// </summary>
    [HttpGet("by-university/{universityId:long}")]
    public async Task<List<UserDto>> GetUsersByUniversity([FromRoute] long universityId, [FromServices] IUserRepository userRepository)
    {
        var users = await userRepository.GetByUniversityId(universityId);
        return users.Select(u => new UserDto(
            u.Id,
            u.FirstName,
            u.LastName,
            u.Username,
            u.Email,
            u.Universities.Select(uu => uu.UniversityId).ToList())).ToList();
    }

    /// <summary>
    /// Создать или обновить пользователя
    /// </summary>
    [HttpPost]
    [Authorize]
    public Task<UserDto> CreateOrUpdateUser([FromBody] CreateOrUpdateUserRequest request)
    {
        var command = new CreateOrUpdateUserCommand(
            request.Id,
            request.FirstName,
            request.LastName,
            request.Username,
            request.Email);

        return mediator.Send(command);
    }

    /// <summary>
    /// Добавить пользователя в университет
    /// </summary>
    [HttpPost("{userId:long}/universities/{universityId:long}")]
    [Authorize]
    public Task AddUserToUniversity([FromRoute] long userId, [FromRoute] long universityId)
    {
        return mediator.Send(new AddUserToUniversityCommand(userId, universityId));
    }

    /// <summary>
    /// Удалить пользователя из университета
    /// </summary>
    [HttpDelete("{userId:long}/universities/{universityId:long}")]
    [Authorize]
    public Task RemoveUserFromUniversity([FromRoute] long userId, [FromRoute] long universityId)
    {
        return mediator.Send(new RemoveUserFromUniversityCommand(userId, universityId));
    }
}

