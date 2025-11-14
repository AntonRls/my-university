using HacatonMax.University.Users.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Users.Infrastructure;

internal sealed class UserRepository : IUserRepository
{
    private readonly UsersDbContext _context;

    public UserRepository(UsersDbContext context)
    {
        _context = context;
    }

    public Task<User?> GetById(long id)
    {
        return _context.Users
            .Include(u => u.Universities)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public Task<List<User>> GetByIds(List<long> ids)
    {
        if (ids.Count == 0)
        {
            return Task.FromResult(new List<User>());
        }

        return _context.Users
            .Include(u => u.Universities)
            .Where(u => ids.Contains(u.Id))
            .ToListAsync();
    }

    public Task<User?> GetByUsername(string username)
    {
        return _context.Users
            .Include(u => u.Universities)
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public Task<List<User>> GetByUniversityId(long universityId)
    {
        return _context.Users
            .Include(u => u.Universities)
            .Where(u => u.Universities.Any(uu => uu.UniversityId == universityId))
            .ToListAsync();
    }

    public async Task Save(User user)
    {
        var existing = await _context.Users
            .Include(u => u.Universities)
            .FirstOrDefaultAsync(u => u.Id == user.Id);

        if (existing != null)
        {
            // Обновляем основные поля
            existing.UpdateProfile(user.FirstName, user.LastName, user.Username, user.Email);

            // Обновляем связи с университетами
            var existingUniversityIds = existing.Universities.Select(uu => uu.UniversityId).ToHashSet();
            var newUniversityIds = user.Universities.Select(uu => uu.UniversityId).ToHashSet();

            // Удаляем связи, которых больше нет
            var toRemove = existing.Universities
                .Where(uu => !newUniversityIds.Contains(uu.UniversityId))
                .ToList();
            foreach (var userUniversity in toRemove)
            {
                existing.Universities.Remove(userUniversity);
            }

            // Добавляем новые связи
            foreach (var userUniversity in user.Universities)
            {
                if (!existingUniversityIds.Contains(userUniversity.UniversityId))
                {
                    existing.AddUniversity(userUniversity.UniversityId);
                }
            }
        }
        else
        {
            await _context.Users.AddAsync(user);
        }

        await _context.SaveChangesAsync();
    }

    public async Task SaveRange(List<User> users)
    {
        if (users.Count == 0)
        {
            return;
        }

        var existingIds = await _context.Users
            .Where(u => users.Select(x => x.Id).Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync();

        var toUpdate = users.Where(u => existingIds.Contains(u.Id)).ToList();
        var toAdd = users.Where(u => !existingIds.Contains(u.Id)).ToList();

        foreach (var user in toUpdate)
        {
            var existing = await _context.Users.FindAsync(user.Id);
            if (existing != null)
            {
                _context.Entry(existing).CurrentValues.SetValues(user);
            }
        }

        if (toAdd.Count > 0)
        {
            await _context.Users.AddRangeAsync(toAdd);
        }

        await _context.SaveChangesAsync();
    }
}

