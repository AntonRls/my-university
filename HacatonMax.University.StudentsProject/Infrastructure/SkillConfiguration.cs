using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.ToTable("skills");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id");
        builder.Property(x => x.Name)
            .HasColumnName("name");

        builder
            .HasMany(s => s.StudentProjects)
            .WithMany(p => p.NeedSkills)
            .UsingEntity<SkillStudentProject>(
                j => j
                    .HasOne(sp => sp.StudentProject)
                    .WithMany()
                    .HasForeignKey(sp => sp.StudentProjectId)
                    .OnDelete(DeleteBehavior.Cascade),
                j => j
                    .HasOne(sp => sp.Skill)
                    .WithMany()
                    .HasForeignKey(sp => sp.SkillId)
                    .OnDelete(DeleteBehavior.Cascade),
                j =>
                {
                    j.ToTable("skill_student_projects");
                    j.HasKey(x => new { x.SkillId, x.StudentProjectId });
                });
    }
}
