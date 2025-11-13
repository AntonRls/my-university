using HacatonMax.University.Events.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Events.Infrastructure.Configurations;

public sealed class UniversityEventRegistrationConfiguration : IEntityTypeConfiguration<UniversityEventRegistration>
{
    public void Configure(EntityTypeBuilder<UniversityEventRegistration> builder)
    {
        builder.ToTable("university_event_registrations");

        builder.HasKey(registration => registration.Id);

        builder.Property(registration => registration.Id)
            .HasColumnName("id");

        builder.Property(registration => registration.UniversityEventId)
            .HasColumnName("university_event_id");

        builder.Property(registration => registration.UserId)
            .HasColumnName("user_id");

        builder.Property(registration => registration.CreatedAt)
            .HasColumnName("created_at");

        builder
            .HasIndex(registration => new { registration.UniversityEventId, registration.UserId })
            .IsUnique();
    }
}

