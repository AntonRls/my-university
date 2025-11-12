using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public class StudentProjectParticipantRoleConfiguration : IEntityTypeConfiguration<StudentProjectParticipantRole>
{
    public void Configure(EntityTypeBuilder<StudentProjectParticipantRole> builder)
    {
        builder.ToTable("student_project_participant_roles");

        builder.HasKey(role => role.Id);

        builder.Property(role => role.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(role => role.ParticipantId)
            .HasColumnName("participant_id");

        builder.Property(role => role.TeamRoleId)
            .HasColumnName("team_role_id");

        builder.HasIndex(role => new { role.ParticipantId, role.TeamRoleId })
            .IsUnique();

        builder
            .HasOne(role => role.Participant)
            .WithMany(participant => participant.ParticipantRoles)
            .HasForeignKey(role => role.ParticipantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(role => role.TeamRole)
            .WithMany()
            .HasForeignKey(role => role.TeamRoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

