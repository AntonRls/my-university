using HacatonMax.University.Deadlines.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Deadlines.Infrastructure.Configurations;

public class DeadlineCompletionConfiguration : IEntityTypeConfiguration<DeadlineCompletion>
{
    public void Configure(EntityTypeBuilder<DeadlineCompletion> builder)
    {
        builder.ToTable("deadline_completions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.DeadlineId).HasColumnName("deadline_id").IsRequired();
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.CompletedAt).HasColumnName("completed_at").IsRequired();

        builder.HasIndex(x => new { x.DeadlineId, x.UserId }).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.UserId });
    }
}


