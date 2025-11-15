using HacatonMax.University.Schedule.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Schedule.Infrastructure.Configurations;

public class ScheduleAttendeeConfiguration : IEntityTypeConfiguration<ScheduleAttendee>
{
    public void Configure(EntityTypeBuilder<ScheduleAttendee> builder)
    {
        builder.ToTable("attendees");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.ScheduleEntryId).HasColumnName("schedule_entry_id").IsRequired();
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.AddedAt).HasColumnName("added_at").IsRequired();

        builder.HasIndex(x => new { x.ScheduleEntryId, x.UserId })
            .IsUnique()
            .HasDatabaseName("ux_schedule_attendees_entry_user");
    }
}

