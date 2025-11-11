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

    public Task<List<University>> GetAll()
    {
        return _dbContext.Universities.AsNoTracking().ToListAsync();
    }

    public async Task Save(University university)
    {
        await _dbContext.Universities.AddAsync(university);
        await _dbContext.SaveChangesAsync();
    }
}
