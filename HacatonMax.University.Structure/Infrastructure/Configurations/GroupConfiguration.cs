using HacatonMax.University.Structure.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Structure.Infrastructure.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.ToTable("groups");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.TenantId).HasColumnName("tenant_id").IsRequired();
        builder.Property(x => x.ProgramCourseId).HasColumnName("program_course_id").IsRequired();
        builder.Property(x => x.Type).HasColumnName("type").HasConversion<string>().IsRequired();
        builder.Property(x => x.Label).HasColumnName("label").HasMaxLength(128).IsRequired();
        builder.Property(x => x.Capacity).HasColumnName("capacity").IsRequired();
        builder.Property(x => x.IsPrimaryAllowed).HasColumnName("is_primary_allowed").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired();
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");

        builder.HasOne(x => x.ProgramCourse)
            .WithMany(x => x.Groups)
            .HasForeignKey(x => x.ProgramCourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.CustomMeta)
            .WithOne(x => x.Group)
            .HasForeignKey<CustomGroupMeta>(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.TenantId, x.ProgramCourseId, x.Label }).IsUnique();
    }
}
