using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public class StudentProjectConfiguration : IEntityTypeConfiguration<StudentProject>
{
    public void Configure(EntityTypeBuilder<StudentProject> builder)
    {
        builder.ToTable("student_projects");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedOnAdd();
        builder.Property(x => x.Title)
            .HasColumnName("title");
        builder.Property(x => x.Description)
            .HasColumnName("description");
        builder.Property(x => x.CreatorId)
            .HasColumnName("creator_id");
        builder.Property(x => x.EventId)
            .HasColumnName("event_id");

        builder
            .HasMany(s => s.NeedSkills)
            .WithMany(p => p.StudentProjects)
            .UsingEntity(j => j.ToTable("student_project_skills"));

        builder
            .HasMany(studentProject => studentProject.Participants)
            .WithOne(participant => participant.StudentProject)
            .HasForeignKey(participant => participant.StudentProjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
