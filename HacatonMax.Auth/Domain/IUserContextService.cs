namespace HacatonMax.Auth.Domain;

public interface IUserContextService
{
    User GetCurrentUser();

    User? GetCurrentUserOrDefault();
}
