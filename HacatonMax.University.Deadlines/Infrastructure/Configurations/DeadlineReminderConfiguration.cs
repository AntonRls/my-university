using HacatonMax.University.Deadlines.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Deadlines.Infrastructure.Configurations;

public class DeadlineReminderConfiguration : IEntityTypeConfiguration<DeadlineReminder>
{
    public void Configure(EntityTypeBuilder<DeadlineReminder> builder)
    {
        builder.ToTable("deadline_reminders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.DeadlineId).HasColumnName("deadline_id").IsRequired();
        builder.Property(x => x.Offset).HasColumnName("offset").HasConversion<string>().IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.SentAt).HasColumnName("sent_at");

        builder.HasIndex(x => new { x.DeadlineId, x.Offset }).IsUnique();
    }
}


