using HacatonMax.Admin.Domain;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.Admin.Infrastructure;

public static class DependencyExtension
{
    public static IServiceCollection AddAdminInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<AdminDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });

        services.AddScoped<IUniversityRepository, UniversityRepository>();

        return services;
    }
}
