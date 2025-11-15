using HacatonMax.University.Schedule.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Schedule.Infrastructure.Configurations;

public class ScheduleEntryConfiguration : IEntityTypeConfiguration<ScheduleEntry>
{
    public void Configure(EntityTypeBuilder<ScheduleEntry> builder)
    {
        builder.ToTable("entries");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.GroupId).HasColumnName("group_id");
        builder.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        builder.Property(x => x.SourceEntityId).HasColumnName("source_entity_id");
        builder.Property(x => x.SourceType)
            .HasColumnName("source_type")
            .HasConversion<string>()
            .IsRequired();
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(256).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(2048);
        builder.Property(x => x.Teacher).HasColumnName("teacher").HasMaxLength(256);
        builder.Property(x => x.PhysicalLocation).HasColumnName("physical_location").HasMaxLength(512);
        builder.Property(x => x.OnlineLink).HasColumnName("online_link").HasMaxLength(1024);
        builder.Property(x => x.StartsAt).HasColumnName("starts_at").IsRequired();
        builder.Property(x => x.EndsAt).HasColumnName("ends_at").IsRequired();
        builder.Property(x => x.DeliveryType)
            .HasColumnName("delivery_type")
            .HasConversion<string>()
            .IsRequired();
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();

        builder.HasMany(x => x.Attendees)
            .WithOne(x => x.ScheduleEntry)
            .HasForeignKey(x => x.ScheduleEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TenantId, x.GroupId, x.StartsAt }).HasDatabaseName("ix_schedule_entries_group_window");
        builder.HasIndex(x => new { x.OwnerUserId, x.StartsAt }).HasDatabaseName("ix_schedule_entries_owner_window");
        builder.HasIndex(x => new { x.TenantId, x.SourceType, x.SourceEntityId })
            .HasDatabaseName("ux_schedule_entries_source")
            .IsUnique()
            .HasFilter("source_entity_id IS NOT NULL");
        builder.HasIndex(x => new { x.TenantId, x.StartsAt }).HasDatabaseName("ix_schedule_entries_range");
    }
}

