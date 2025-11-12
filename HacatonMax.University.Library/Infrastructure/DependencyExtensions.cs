using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using HacatonMax.University.Library.Application.Commands.CreateBook;
using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure.Options;
using HacatonMax.University.Library.Infrastructure.Search;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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
        services.Configure<ElasticsearchOptions>(configuration.GetSection(ElasticsearchOptions.SectionName));
        services.AddSingleton<ElasticsearchClient>(provider =>
        {
            var options = provider.GetRequiredService<IOptions<ElasticsearchOptions>>().Value;

            if (string.IsNullOrWhiteSpace(options.Uri))
            {
                throw new InvalidOperationException("Не настроен адрес Elasticsearch");
            }

            var settings = new ElasticsearchClientSettings(new Uri(options.Uri));

            if (!string.IsNullOrWhiteSpace(options.Username) && !string.IsNullOrWhiteSpace(options.Password))
            {
                settings = settings.Authentication(new BasicAuthentication(options.Username, options.Password));
            }

            if (options.RequestTimeoutSeconds > 0)
            {
                settings = settings.RequestTimeout(TimeSpan.FromSeconds(options.RequestTimeoutSeconds));
            }

            if (!string.IsNullOrWhiteSpace(options.IndexName))
            {
                settings = settings.DefaultIndex(options.IndexName);
            }

            return new ElasticsearchClient(settings);
        });
        services.AddScoped<IBookRepository, BookRepository>();
        services.AddSingleton<IBookSearchService, BookSearchService>();
        services.AddScoped<BookSearchReindexJob>();
        services.AddHostedService<BookSearchIndexInitializer>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(CreateBookCommand).Assembly);
        });
        return services;
    }
}
