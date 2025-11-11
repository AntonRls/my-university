using TimeWarp.Mediator;

namespace HacatonMax.University.Auth.Application.Commands.GetUserToken;

public record GetUserTokenCommand(
    string QueryParams) : IRequest<string>;
