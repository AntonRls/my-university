using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public class StudentProjectParticipantConfiguration : IEntityTypeConfiguration<StudentProjectParticipant>
{
    public void Configure(EntityTypeBuilder<StudentProjectParticipant> builder)
    {
        builder.ToTable("student_project_participants");

        builder.HasKey(participant => participant.Id);

        builder.Property(participant => participant.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();

        builder.Property(participant => participant.StudentProjectId)
            .HasColumnName("student_project_id");

        builder.Property(participant => participant.UserId)
            .HasColumnName("user_id");

        builder.Property(participant => participant.Status)
            .HasColumnName("status")
            .HasConversion<int>();

        builder.Property(participant => participant.IsCreator)
            .HasColumnName("is_creator");

        builder.Property(participant => participant.CreatedAt)
            .HasColumnName("created_at");

        builder.HasIndex(participant => new { participant.StudentProjectId, participant.UserId })
            .IsUnique();

    }
}

