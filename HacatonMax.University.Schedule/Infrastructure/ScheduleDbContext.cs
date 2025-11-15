using HacatonMax.University.Schedule.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Schedule.Infrastructure;

public class ScheduleDbContext(DbContextOptions<ScheduleDbContext> options) : DbContext(options)
{
    public DbSet<ScheduleEntry> ScheduleEntries => Set<ScheduleEntry>();

    public DbSet<ScheduleAttendee> ScheduleAttendees => Set<ScheduleAttendee>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("schedule");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ScheduleDbContext).Assembly);
    }
}

