using HacatonMax.University.Deadlines.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Deadlines.Infrastructure.Configurations;

public class DeadlineConfiguration : IEntityTypeConfiguration<Deadline>
{
    public void Configure(EntityTypeBuilder<Deadline> builder)
    {
        builder.ToTable("deadlines");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.GroupId).HasColumnName("group_id").IsRequired();
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(256).IsRequired();
        builder.Property(x => x.DescriptionHtml).HasColumnName("description_html").HasColumnType("text").IsRequired();
        builder.Property(x => x.DueAt).HasColumnName("due_at").IsRequired();
        builder.Property(x => x.ScheduleEntryId).HasColumnName("schedule_entry_id");
        builder.Property(x => x.CreatorUserId).HasColumnName("creator_user_id").IsRequired();
        builder.Property(x => x.LastEditorUserId).HasColumnName("last_editor_user_id").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasConversion<string>().IsRequired();
        builder.Property(x => x.AccessScope).HasColumnName("access_scope").HasConversion<string>().IsRequired();
        builder.Property(x => x.CompletedAt).HasColumnName("completed_at");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");
        builder.Property(x => x.LastNotificationAt).HasColumnName("last_notification_at");

        builder.HasMany(x => x.Completions)
            .WithOne(x => x.Deadline)
            .HasForeignKey(x => x.DeadlineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Reminders)
            .WithOne(x => x.Deadline)
            .HasForeignKey(x => x.DeadlineId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TenantId, x.GroupId });
        builder.HasIndex(x => x.ScheduleEntryId).HasFilter("schedule_entry_id IS NOT NULL");
    }
}


