using HacatonMax.University.Structure.Domain;
using HacatonMax.University.Structure.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Structure.Infrastructure;

public sealed class StructureDbContext : DbContext
{
    public const string Schema = "structure";

    public StructureDbContext(DbContextOptions<StructureDbContext> options)
        : base(options)
    {
    }

    public DbSet<Faculty> Faculties => Set<Faculty>();

    public DbSet<AcademicProgram> AcademicPrograms => Set<AcademicProgram>();

    public DbSet<ProgramCourse> ProgramCourses => Set<ProgramCourse>();

    public DbSet<Group> Groups => Set<Group>();

    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();

    public DbSet<CustomGroupMeta> CustomGroupMeta => Set<CustomGroupMeta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new FacultyConfiguration());
        modelBuilder.ApplyConfiguration(new AcademicProgramConfiguration());
        modelBuilder.ApplyConfiguration(new ProgramCourseConfiguration());
        modelBuilder.ApplyConfiguration(new GroupConfiguration());
        modelBuilder.ApplyConfiguration(new GroupMemberConfiguration());
        modelBuilder.ApplyConfiguration(new CustomGroupMetaConfiguration());
    }
}
