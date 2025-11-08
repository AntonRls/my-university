using HacatonMax.University.Library.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HacatonMax.University.Library.Infrastructure.Configurations;

public class BookConfiguration : IEntityTypeConfiguration<Book>
{
    public void Configure(EntityTypeBuilder<Book> builder)
    {
        builder.ToTable("books");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id");
        builder.Property(x => x.Title)
            .HasColumnName("title");
        builder.Property(x => x.Description)
            .HasColumnName("description");
        builder.Property(x => x.Count)
            .HasColumnName("count");
        builder.Property(x => x.TakeCount)
            .HasColumnName("take_count");

        builder
            .HasMany(e => e.Tags)
            .WithMany()
            .UsingEntity<Dictionary<string, object>>(
                "university_books_tags",
                j => j.HasOne<Tag>().WithMany().HasForeignKey("tag_id"),
                j => j.HasOne<Book>().WithMany().HasForeignKey("university_book_id"),
                j => j.HasKey("university_book_id", "tag_id")
            );
    }
}
