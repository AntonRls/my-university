using HacatonMax.Admin.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.Admin.Infrastructure;

internal class UniversityRepository : IUniversityRepository
{
    private readonly AdminDbContext _dbContext;

    public UniversityRepository(AdminDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<List<Domain.University>> GetAll()
    {
        return _dbContext.Universities.AsNoTracking().ToListAsync();
    }

    public async Task Save(Domain.University university)
    {
        await _dbContext.Universities.AddAsync(university);
        await _dbContext.SaveChangesAsync();
    }

    public Task<List<UserInUniversity>> GetUserUniversities(long userId)
    {
        return _dbContext.UsersInUniversity
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task UpdateStatus(long userId, long universityId, ApproveStatus status)
    {
        var university = await _dbContext.Universities.FirstOrDefaultAsync(x => x.Id == universityId);
        if (university == null)
        {
            return;
        }
        var exist = await _dbContext.UsersInUniversity.FirstOrDefaultAsync(x => x.UserId == userId && x.UniversityId == universityId);

        if (exist == null)
        {
            var userInUniversity = new UserInUniversity(userId, university.TenantName, universityId);
            userInUniversity.UpdateStatus(status);
            await _dbContext.UsersInUniversity.AddAsync(userInUniversity);
        }
        else
        {
            await _dbContext.UsersInUniversity
                .Where(x => x.UserId == userId && x.UniversityId == universityId)
                .ExecuteUpdateAsync(x => x.SetProperty(setter => setter.ApproveStatus, status));
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> RemoveUserFromUniversity(long userId, long universityId)
    {
        var entity = await _dbContext.UsersInUniversity
            .FirstOrDefaultAsync(x => x.UserId == userId && x.UniversityId == universityId);

        if (entity == null)
        {
            return false;
        }

        _dbContext.UsersInUniversity.Remove(entity);
        await _dbContext.SaveChangesAsync();

        return true;
    }
}
