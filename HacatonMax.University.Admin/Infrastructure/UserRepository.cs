using HacatonMax.University.Admin.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Admin.Infrastructure;

public class UserRepository : IUserRepository
{
    private readonly AdminDbContext _context;
    public UserRepository(AdminDbContext context)
    {
        _context = context;
    }

    public async Task Save(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetUserWhoWaitApprove()
    {
        return await _context.Users
            .Where(x => x.Status == ApproveStatus.WaitApprove)
            .ToListAsync();
    }

    public async Task UpdateApproveStatusInUser(long userId, ApproveStatus status)
    {
        await _context.Users
            .Where(x => x.Id == userId)
            .ExecuteUpdateAsync(setters =>
                setters.SetProperty(u => u.Status, status));
    }
}
