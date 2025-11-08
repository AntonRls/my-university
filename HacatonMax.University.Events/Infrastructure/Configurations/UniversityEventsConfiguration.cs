using HacatonMax.University.Events.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Events.Infrastructure.Configurations;

public class UniversityEventsConfiguration : IEntityTypeConfiguration<UniversityEvent>
{
    public void Configure(EntityTypeBuilder<UniversityEvent> builder)
    {
        builder.ToTable("university_events");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasColumnName("id");
        builder.Property(p => p.Description)
            .HasColumnName("description");
        builder.Property(p => p.Title)
            .HasColumnName("title");
        builder.Property(p => p.EndDateTime)
            .HasColumnName("end_datetime");
        builder.Property(p => p.StartDateTime)
            .HasColumnName("start_datetime");

        builder
            .HasMany(e => e.Tags)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "university_events_tags",
                j => j.HasOne<Tag>().WithMany().HasForeignKey("tag_id"),
                j => j.HasOne<UniversityEvent>().WithMany().HasForeignKey("university_event_id"),
                j => j.HasKey("university_event_id", "tag_id")
            );
    }
}
