using HacatonMax.University.Events.Application.Commands.CreateUniversityEvent;
using HacatonMax.University.Events.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Events.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityEventsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<UniversityEventsDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });
        services.AddScoped<IUniversityEventsRepository, UniversityEventsRepository>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(CreateUniversityEventCommand).Assembly);
        });
        return services;
    }
}
