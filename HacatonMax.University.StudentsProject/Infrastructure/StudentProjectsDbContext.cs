using HacatonMax.University.StudentsProject.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.StudentsProject.Infrastructure;

public sealed class StudentProjectsDbContext : DbContext
{
    public const string Schema = "students-projects";

    public StudentProjectsDbContext(DbContextOptions<StudentProjectsDbContext> options)
        : base(options)
    {
    }


    public DbSet<StudentProject> StudentProjects { get; set; }

    public DbSet<Skill> Skills { get; set; }

    public DbSet<SkillStudentProject> SkillStudentProjectDictionary { get; set; }

    public DbSet<TeamRole> TeamRoles { get; set; }

    public DbSet<StudentProjectParticipant> StudentProjectParticipants { get; set; }

    public DbSet<StudentProjectParticipantRole> StudentProjectParticipantRoles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new SkillConfiguration());
        modelBuilder.ApplyConfiguration(new StudentProjectConfiguration());
        modelBuilder.ApplyConfiguration(new TeamRoleConfiguration());
        modelBuilder.ApplyConfiguration(new StudentProjectParticipantConfiguration());
        modelBuilder.ApplyConfiguration(new StudentProjectParticipantRoleConfiguration());

        modelBuilder.Entity<SkillStudentProject>(b =>
        {
            b.ToTable("skill_student_projects");

            b.HasKey(x => new { x.SkillId, x.StudentProjectId });

            b.HasOne(x => x.Skill)
                .WithMany()
                .HasForeignKey(x => x.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(x => x.StudentProject)
                .WithMany()
                .HasForeignKey(x => x.StudentProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
