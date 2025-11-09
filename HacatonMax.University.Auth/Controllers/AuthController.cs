using HacatonMax.University.Auth.Application.Commands.GetUserToken;
using HacatonMax.University.Auth.Controllers.Dto;
using Microsoft.AspNetCore.Mvc;
using TimeWarp.Mediator;

namespace HacatonMax.University.Auth.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<AccessTokenDto> Post([FromBody] GetUserTokenCommand command)
    {
        var accessToken = await _mediator.Send(command);
        return new AccessTokenDto(accessToken);
    }

}
