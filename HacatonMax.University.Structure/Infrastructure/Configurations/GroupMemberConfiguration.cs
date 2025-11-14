using HacatonMax.University.Structure.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Structure.Infrastructure.Configurations;

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.ToTable("group_members");
        builder.HasKey(x => new { x.GroupId, x.StudentId });

        builder.Property(x => x.GroupId).HasColumnName("group_id");
        builder.Property(x => x.StudentId).HasColumnName("student_id").IsRequired();
        builder.Property(x => x.MembershipType).HasColumnName("membership_type").HasConversion<string>().IsRequired();
        builder.Property(x => x.JoinedAt).HasColumnName("joined_at").IsRequired();

        builder.HasOne(x => x.Group)
            .WithMany(x => x.Members)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.StudentId);
    }
}
