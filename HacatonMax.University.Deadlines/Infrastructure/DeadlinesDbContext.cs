using HacatonMax.University.Deadlines.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Deadlines.Infrastructure;

public class DeadlinesDbContext : DbContext
{
    public const string Schema = "deadlines";

    public DeadlinesDbContext(DbContextOptions<DeadlinesDbContext> options)
        : base(options)
    {
    }

    public DbSet<Deadline> Deadlines => Set<Deadline>();

    public DbSet<DeadlineCompletion> DeadlineCompletions => Set<DeadlineCompletion>();

    public DbSet<DeadlineReminder> DeadlineReminders => Set<DeadlineReminder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DeadlinesDbContext).Assembly);
    }
}


