using HacatonMax.University.Library.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Library.Infrastructure.Configurations;

public class ReservationBookConfiguration : IEntityTypeConfiguration<ReservationBook>
{
    public void Configure(EntityTypeBuilder<ReservationBook> builder)
    {
        builder.ToTable("reservation_books");

        builder.HasKey(x => new
        {
            x.ReservationOwnerId,
            x.BookId
        });

        builder.Property(p => p.BookId)
            .HasColumnName("book_id");
        builder.Property(p => p.ReservationOwnerId)
            .HasColumnName("reservation_owner_id");
        builder.Property(p => p.CountExtendReservation)
            .HasColumnName("count_extend_reservation");
        builder.Property(p => p.EndReservationDate)
            .HasColumnName("end_reservation_date");

        builder.HasOne(p => p.Book)
            .WithOne();
    }
}
