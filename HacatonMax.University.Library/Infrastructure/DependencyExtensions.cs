using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Library.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityLibraryModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<UniversityLibraryDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(CreateBookCommand).Assembly);
        });
        return services;
    }
}
