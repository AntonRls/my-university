using HacatonMax.University.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Users.Infrastructure.Configurations;

public class UserUniversityConfiguration : IEntityTypeConfiguration<UserUniversity>
{
    public void Configure(EntityTypeBuilder<UserUniversity> builder)
    {
        builder.ToTable("user_universities");

        builder.HasKey(uu => new { uu.UserId, uu.UniversityId });

        builder.Property(p => p.UserId)
            .HasColumnName("user_id");

        builder.Property(p => p.UniversityId)
            .HasColumnName("university_id");

        builder.Property(p => p.JoinedAt)
            .HasColumnName("joined_at")
            .IsRequired();

        builder.HasOne(uu => uu.User)
            .WithMany(u => u.Universities)
            .HasForeignKey(uu => uu.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(uu => uu.UniversityId);
        builder.HasIndex(uu => uu.UserId);
    }
}

