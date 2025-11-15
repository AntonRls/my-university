namespace HacatonMax.Common.AuthHelper;

public interface IUserContextService
{
    User GetCurrentUser();

    User? GetCurrentUserOrDefault();
}
