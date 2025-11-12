using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public class TeamRoleConfiguration : IEntityTypeConfiguration<TeamRole>
{
    public void Configure(EntityTypeBuilder<TeamRole> builder)
    {
        builder.ToTable("team_roles");

        builder.HasKey(role => role.Id);

        builder.Property(role => role.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(role => role.Name)
            .HasColumnName("name")
            .IsRequired();

        builder.Property(role => role.Description)
            .HasColumnName("description");
    }
}

