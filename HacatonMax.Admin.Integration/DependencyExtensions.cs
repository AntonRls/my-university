using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.Admin.Integration;

public static class DependencyExtensions
{
    public static IServiceCollection AddAdminUniversitiesHttpClient(this IServiceCollection services)
    {
        services.AddSingleton<AdminUniversitiesClient>();
        return services;
    }
}
