using HacatonMax.Admin.Domain;
using HacatonMax.Admin.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.Admin.Infrastructure;

internal sealed class AdminDbContext : DbContext
{
    public const string Schema = "admin";

    public AdminDbContext(DbContextOptions<AdminDbContext> options)
        : base(options)
    {
        Database.EnsureCreated();
    }

    public DbSet<University> Universities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UniversityConfiguration());
    }
}
