using HacatonMax.University.Admin.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Admin.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id");
        builder.Property(p => p.FirstName)
            .HasColumnName("first_name");
        builder.Property(p => p.LastName)
            .HasColumnName("last_name");
        builder.Property(p => p.Role)
            .HasColumnName("role")
            .HasConversion<string>();
        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasConversion<string>();
        builder.Property(p => p.Username)
            .HasColumnName("username");
    }
}
