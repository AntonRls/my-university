using HacatonMax.University.Users.Application.Commands.AddUserToUniversity;
using HacatonMax.University.Users.Application.Commands.GetUserById;
using HacatonMax.University.Users.Domain;
using HacatonMax.University.Users.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Users;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityUsersModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<UsersDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });

        services.AddScoped<IUserRepository, UserRepository>();

        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(GetUserByIdCommand).Assembly);
        });

        return services;
    }
}

