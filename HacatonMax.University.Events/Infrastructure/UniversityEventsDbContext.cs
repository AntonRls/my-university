using HacatonMax.University.Events.Domain;
using HacatonMax.University.Events.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Events.Infrastructure;

public sealed class UniversityEventsDbContext : DbContext
{
    public const string Schema = "university-events";

    public UniversityEventsDbContext(DbContextOptions<UniversityEventsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Tag> Tags { get; set; }

    public DbSet<UniversityEvent> UniversityEvents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new TagConfiguration());
        modelBuilder.ApplyConfiguration(new UniversityEventsConfiguration());
    }
}
