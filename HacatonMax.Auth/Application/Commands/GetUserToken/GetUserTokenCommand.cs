using TimeWarp.Mediator;

namespace HacatonMax.Auth.Application.Commands.GetUserToken;

public record GetUserTokenCommand(
    string QueryParams) : IRequest<string>;
