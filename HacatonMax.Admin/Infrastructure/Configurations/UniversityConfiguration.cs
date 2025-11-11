using HacatonMax.Admin.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.Admin.Infrastructure.Configurations;

public class UniversityConfiguration : IEntityTypeConfiguration<University>
{
    public void Configure(EntityTypeBuilder<University> builder)
    {
        builder.ToTable("universities");

        builder.HasKey(x => x.Id);

        builder.Property(p => p.Name)
            .HasColumnName("name");
        builder.Property(p => p.TenantName)
            .HasColumnName("tenant_name");
        builder.Property(p => p.Id)
            .HasColumnName("id");
    }
}
