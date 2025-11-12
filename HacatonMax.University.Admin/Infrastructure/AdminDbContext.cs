using HacatonMax.University.Admin.Domain;
using HacatonMax.University.Admin.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Admin.Infrastructure;

public sealed class AdminDbContext : DbContext
{
    public const string Schema = "admin";

    public AdminDbContext(DbContextOptions<AdminDbContext> options)
        : base(options)
    {
    }

    public DbSet<User>  Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
    }
}
