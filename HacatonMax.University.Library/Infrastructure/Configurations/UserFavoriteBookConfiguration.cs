using HacatonMax.University.Library.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Library.Infrastructure.Configurations;

public class UserFavoriteBookConfiguration : IEntityTypeConfiguration<UserFavoriteBook>
{
    public void Configure(EntityTypeBuilder<UserFavoriteBook> builder)
    {
        builder.ToTable("user_favorite_books");

        builder.HasKey(x => new { x.UserId, x.BookId });

        builder.Property(p => p.UserId)
            .HasColumnName("user_id");
        builder.Property(p => p.BookId)
            .HasColumnName("book_id");

        builder.HasIndex(p => p.UserId);
    }
}
