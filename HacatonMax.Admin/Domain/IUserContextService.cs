using HacatonMax.University.Auth.Domain;

namespace HacatonMax.Admin.Domain;

public interface IUserContextService
{
    User GetCurrentUser();
}
