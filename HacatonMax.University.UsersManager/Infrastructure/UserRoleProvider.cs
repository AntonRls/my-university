using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Admin.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Admin.Infrastructure;

public sealed class UserRoleProvider : IUserRoleProvider
{
    private readonly AdminDbContext _dbContext;

    public UserRoleProvider(AdminDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UniversityUserRole> GetUserRole(long userId, CancellationToken cancellationToken)
    {
        var role = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.Role)
            .SingleOrDefaultAsync(cancellationToken);

        return role switch
        {
            UserRole.Teacher => UniversityUserRole.Teacher,
            UserRole.Student => UniversityUserRole.Student,
            _ => UniversityUserRole.Student
        };
    }
}


