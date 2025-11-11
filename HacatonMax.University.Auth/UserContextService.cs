using System.Security.Claims;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using Microsoft.AspNetCore.Http;

namespace HacatonMax.University.Auth;

public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public User GetCurrentUser()
    {
        return new User(96056860, "test", "test", "test");

        var user = _httpContextAccessor.HttpContext?.User;

        if (user == null || !user.Identity?.IsAuthenticated == true)
        {
            throw new ForbiddenException("Not valid token");
        }

        var id = long.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var firstName = user.FindFirst("firstName")?.Value;
        var lastName = user.FindFirst("lastName")?.Value;
        var username = user.FindFirst(ClaimTypes.Name)?.Value;

        return new User(id, firstName!, lastName!, username!);
    }
}
