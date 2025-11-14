using HacatonMax.University.Structure.Application.Abstractions;
using HacatonMax.University.Structure.Application.Queries.GetStructureTree;
using HacatonMax.University.Structure.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Structure.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityStructureModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContextAccessor, HttpTenantContextAccessor>();

        services.AddDbContext<StructureDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });

        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(GetStructureTreeQuery).Assembly);
        });

        return services;
    }
}
