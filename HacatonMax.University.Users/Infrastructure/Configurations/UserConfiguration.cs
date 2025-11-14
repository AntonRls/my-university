using HacatonMax.University.Users.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Users.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id")
            .ValueGeneratedNever(); // ID приходит из JWT токена, не генерируется автоматически

        builder.Property(p => p.FirstName)
            .HasColumnName("first_name")
            .IsRequired();

        builder.Property(p => p.LastName)
            .HasColumnName("last_name")
            .IsRequired();

        builder.Property(p => p.Username)
            .HasColumnName("username");

        builder.Property(p => p.Email)
            .HasColumnName("email");

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(p => p.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasFilter("\"username\" IS NOT NULL");

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasFilter("\"email\" IS NOT NULL");
    }
}

