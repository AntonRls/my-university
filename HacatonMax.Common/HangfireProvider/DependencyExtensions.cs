using HacatonMax.Common.Abstractions;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Tags;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.Common.HangfireProvider;

public static class DependencyExtensions
{
    public static IServiceCollection AddHangfireProvider(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHangfire(config =>
            config.UsePostgreSqlStorage(x =>
            {
                x.UseNpgsqlConnection(configuration.GetConnectionString("Postgres"));
            })
                .UseTags()
        );

        services.AddHangfireServer();
        services.AddScoped<IJobsProvider, Common.HangfireProvider.HangfireProvider>();
        return services;
    }
}
