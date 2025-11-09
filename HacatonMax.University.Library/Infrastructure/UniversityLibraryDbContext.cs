using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure.Configurations;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.University.Library.Infrastructure;

public sealed class UniversityLibraryDbContext : DbContext
{
    public const string Schema = "university-library";

    public UniversityLibraryDbContext(DbContextOptions<UniversityLibraryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Tag> Tags { get; set; }

    public DbSet<Book> Books { get; set; }

    public DbSet<UserFavoriteBook> UserFavoriteBooks { get; set; }

    public DbSet<ReservationBook> ReservationBooks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new TagConfiguration());
        modelBuilder.ApplyConfiguration(new BookConfiguration());
        modelBuilder.ApplyConfiguration(new UserFavoriteBookConfiguration());
        modelBuilder.ApplyConfiguration(new ReservationBookConfiguration());
    }
}
