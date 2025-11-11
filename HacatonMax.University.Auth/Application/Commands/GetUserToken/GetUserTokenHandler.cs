using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using Microsoft.Extensions.Configuration;
using TimeWarp.Mediator;

namespace HacatonMax.University.Auth.Application.Commands.GetUserToken;

public class GetUserTokenHandler : IRequestHandler<GetUserTokenCommand, string>
{
    private readonly IJwtService _jwtService;
    private readonly string _botToken;

    public GetUserTokenHandler(IConfiguration configuration, IJwtService jwtService)
    {
        _jwtService = jwtService;
        _botToken = configuration["MaxBot:AccessToken"] ??
                    throw new InvalidOperationException("MaxBot:AccessToken is not set");
    }

    public Task<string> Handle(GetUserTokenCommand request, CancellationToken cancellationToken)
    {
        var dict = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["chat"] = request.Chat.GetRawText(),
            ["ip"] = request.Ip,
            ["auth_date"] = request.AuthDate.ToString(),
            ["query_id"] = request.QueryId,
            ["user"] = request.User.GetRawText()
        };

        var dataCheckString = string.Join("\n", dict.Select(kv => $"{kv.Key}={kv.Value}"));

        byte[] keyBytes = Encoding.UTF8.GetBytes("WebAppData" + _botToken);
        byte[] secretKeyBytes;
        using (var hmac = new HMACSHA256(keyBytes))
        {
            secretKeyBytes = hmac.ComputeHash("WebAppData"u8.ToArray());
        }

        byte[] dataBytes = Encoding.UTF8.GetBytes(dataCheckString);
        byte[] hashBytes;
        using (var hmac2 = new HMACSHA256(secretKeyBytes))
        {
            hashBytes = hmac2.ComputeHash(dataBytes);
        }

        string computedHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        if (!string.Equals(computedHash, request.Hash, StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("Invalid hash");
        }

        try
        {
            var userElem = request.User;
            var id = userElem.GetProperty("id").GetInt64();
            var firstName = userElem.GetProperty("first_name").GetString()!;
            var lastName = userElem.GetProperty("last_name").GetString()!;
            var username = string.Empty;
            if (userElem.TryGetProperty("username", out var unProp) && unProp.ValueKind != JsonValueKind.Null)
            {
                username = unProp.GetString()!;
            }

            var user = new User(id, firstName, lastName, username);
            return Task.FromResult(_jwtService.GenerateToken(user));
        }
        catch (Exception ex)
        {
            throw new BadRequestException(ex.Message);
        }
    }
}
