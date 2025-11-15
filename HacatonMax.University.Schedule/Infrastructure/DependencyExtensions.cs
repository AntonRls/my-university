using HacatonMax.Common.Schedule;
using HacatonMax.University.Schedule.Application.Commands.CreateGroupLesson;
using HacatonMax.University.Schedule.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.Schedule.Infrastructure;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityScheduleModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<ScheduleDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });

        services.AddScoped<IScheduleIntegrationService, ScheduleIntegrationService>();

        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(CreateGroupLessonCommand).Assembly);
        });

        return services;
    }
}

