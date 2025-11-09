using System.Text.Json;
using TimeWarp.Mediator;

namespace HacatonMax.University.Auth.Application.Commands.GetUserToken;

public record GetUserTokenCommand(
    string AuthDate,
    string QueryId,
    JsonElement User,
    string Hash) : IRequest<string>;
