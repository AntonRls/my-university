using HacatonMax.Admin.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.Admin.Infrastructure.Configurations;

public class UserInUniversityConfiguration : IEntityTypeConfiguration<UserInUniversity>
{
    public void Configure(EntityTypeBuilder<UserInUniversity> builder)
    {
        builder.ToTable("students_in_universities");

        builder.HasKey(x => new { x.UserId, x.UniversityId });

        builder.Property(p => p.UserId)
            .HasColumnName("user_id");
        builder.Property(p => p.UniversityName)
            .HasColumnName("university_name");
        builder.Property(p => p.UniversityId)
            .HasColumnName("university_id");
        builder.Property(p => p.ApproveStatus)
            .HasColumnName("approve_status")
            .HasConversion<string>();

        builder.HasIndex(p => p.UserId);
    }
}
