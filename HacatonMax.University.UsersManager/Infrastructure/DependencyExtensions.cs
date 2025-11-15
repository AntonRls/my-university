using HacatonMax.Admin.Integration;
using HacatonMax.University.Admin.Application.UpdateUserApproveStatus;
using HacatonMax.University.Admin.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Admin.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityAdmin(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AdminDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(UpdateUserApproveStatusCommand).Assembly);
        });
        services.AddAdminUniversitiesHttpClient();
        return services;
    }
}
