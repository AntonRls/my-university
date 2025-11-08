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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);

        modelBuilder.ApplyConfiguration(new TagConfiguration());
        modelBuilder.ApplyConfiguration(new BookConfiguration());
    }
}
