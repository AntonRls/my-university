using HacatonMax.University.Structure.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Structure.Infrastructure.Configurations;

public class CustomGroupMetaConfiguration : IEntityTypeConfiguration<CustomGroupMeta>
{
    public void Configure(EntityTypeBuilder<CustomGroupMeta> builder)
    {
        builder.ToTable("custom_group_meta");
        builder.HasKey(x => x.GroupId);

        builder.Property(x => x.GroupId).HasColumnName("group_id");
        builder.Property(x => x.CreatedByUserId).HasColumnName("created_by_user_id");
        builder.Property(x => x.CreatedByRole).HasColumnName("created_by_role").HasConversion<string>().IsRequired();
        builder.Property(x => x.Visibility).HasColumnName("visibility").HasConversion<string>().IsRequired();
        builder.Property(x => x.ModerationStatus).HasColumnName("moderation_status").HasConversion<string>().IsRequired();
    }
}
