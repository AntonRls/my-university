using HacatonMax.University.Admin.Application.GetUsersByIds;
using HacatonMax.University.Admin.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Admin.Controllers;

[ApiController]
[Route("users")]
public class UsersController(IMediator mediator)
{
    /// <summary>
    /// Получить список запрашиваемых пользователей
    /// </summary>
    [HttpGet]
    public Task<List<UserDto>> GetUsersByIds([FromQuery] GetUsersByIdsCommand command)
    {
        return mediator.Send(command);
    }
}
