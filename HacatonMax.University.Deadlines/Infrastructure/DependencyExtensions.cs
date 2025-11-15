using HacatonMax.University.Deadlines.Application.Commands.CreateDeadline;
using HacatonMax.University.Deadlines.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Deadlines.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityDeadlinesModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<DeadlinesDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });

        services.AddScoped<IDeadlineNotificationService, DeadlineNotificationService>();

        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(CreateDeadlineCommand).Assembly);
        });

        return services;
    }
}


