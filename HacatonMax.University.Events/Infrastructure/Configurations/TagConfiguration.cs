using HacatonMax.University.Events.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Events.Infrastructure.Configurations;

public class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("tags");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .HasColumnName("name");
        builder.Property(p => p.Id)
            .HasColumnName("id");


    }
}
