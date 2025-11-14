using HacatonMax.University.Users.Domain;
using HacatonMax.University.Users.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Users.Infrastructure;

public sealed class UsersDbContext : DbContext
{
    public const string Schema = "users";

    public UsersDbContext(DbContextOptions<UsersDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<UserUniversity> UserUniversities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new UserUniversityConfiguration());
    }
}

