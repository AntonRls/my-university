using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Web;
using HacatonMax.Auth.Domain;
using HacatonMax.Common.Exceptions;
using TimeWarp.Mediator;

namespace HacatonMax.Auth.Application.Commands.GetUserToken;

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
        var authParams = HttpUtility.ParseQueryString(request.QueryParams);
        var hash = authParams["hash"];
        authParams.Remove("hash");
        var paramKeys = authParams.AllKeys.ToList();
        paramKeys.Sort();
        var sortedParams = string.Join("\n", paramKeys.Select(key => $"{key}={authParams[key]}"));

        using var keyHmac = new HMACSHA256("WebAppData"u8.ToArray());
        var keyHmacData = keyHmac.ComputeHash(Encoding.UTF8.GetBytes(_botToken));

        using var hmac = new HMACSHA256(keyHmacData);
        var hmacData = hmac.ComputeHash(Encoding.UTF8.GetBytes(sortedParams));
        var validHash = Convert.ToHexStringLower(hmacData);
        if (validHash != hash)
        {
            throw new BadRequestException("Invalid hash");
        }

        try
        {
            var userElem = JsonDocument.Parse(authParams["user"]!);
            var id = userElem.RootElement.GetProperty("id").GetInt64();
            var firstName = userElem.RootElement.GetProperty("first_name").GetString()!;
            var lastName = userElem.RootElement.GetProperty("last_name").GetString()!;
            var username = string.Empty;
            if (userElem.RootElement.TryGetProperty("username", out var unProp) && unProp.ValueKind != JsonValueKind.Null)
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

    private static string GetCompactJson(JsonElement element)
    {
        var options = new JsonSerializerOptions
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            WriteIndented = false
        };
        return JsonSerializer.Serialize(element, options);
    }
}
