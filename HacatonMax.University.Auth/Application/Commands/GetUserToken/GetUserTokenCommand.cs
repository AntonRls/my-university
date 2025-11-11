using System.Text.Json;
using TimeWarp.Mediator;

namespace HacatonMax.University.Auth.Application.Commands.GetUserToken;

public record GetUserTokenCommand(
    long AuthDate,
    JsonElement Chat,
    string QueryId,
    JsonElement User,
    string Ip,
    string Hash) : IRequest<string>;
