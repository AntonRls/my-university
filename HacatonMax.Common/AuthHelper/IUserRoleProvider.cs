namespace HacatonMax.Common.AuthHelper;

public interface IUserRoleProvider
{
    Task<UniversityUserRole> GetUserRole(long userId, CancellationToken cancellationToken);
}


