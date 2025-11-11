using HacatonMax.Common.Abstractions;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.Common.HangfireProvider;

public static class DependencyExtensions
{
    public static IServiceCollection AddHangfireProvider(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHangfire(config =>
                config
                    .UsePostgreSqlStorage(configuration.GetConnectionString("Postgres"))
        );

        services.AddHangfireServer();
        services.AddScoped<IJobsProvider, HangfireProvider>();
        return services;
    }
}
