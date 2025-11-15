using System.Security.Claims;
using HacatonMax.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace HacatonMax.Common.AuthHelper;

public class UserContextService : IUserContextService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public UserContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public User GetCurrentUser()
    {
        var user = GetCurrentUserOrDefault();
        if (user == null)
        {
            throw new ForbiddenException("Not valid token");
        }

        return user;
    }

    public User? GetCurrentUserOrDefault()
    {
        var claimsPrincipal = _httpContextAccessor.HttpContext?.User;
        if (claimsPrincipal == null || claimsPrincipal.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var idValue = claimsPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!long.TryParse(idValue, out var id))
        {
            return null;
        }

        var firstName = claimsPrincipal.FindFirst("firstName")?.Value ?? string.Empty;
        var lastName = claimsPrincipal.FindFirst("lastName")?.Value ?? string.Empty;
        var username = claimsPrincipal.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;

        return new User(id, firstName, lastName, username);
    }
}
