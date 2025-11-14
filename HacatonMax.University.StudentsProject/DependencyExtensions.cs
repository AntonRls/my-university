using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;
using HacatonMax.University.StudentsProject.Domain;
using HacatonMax.University.StudentsProject.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace HacatonMax.University.StudentsProject;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityStudentProjectsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<StudentProjectsDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"), npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
                npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
            });
            options.ConfigureWarnings(warnings =>
                warnings.Ignore(RelationalEventId.MultipleCollectionIncludeWarning));
            
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") 
                ?? configuration.GetValue<string>("ASPNETCORE_ENVIRONMENT") 
                ?? "Production";
            
            if (environment == "Development")
            {
                options.EnableSensitiveDataLogging(false);
                options.EnableDetailedErrors();
                options.LogTo(
                    Console.WriteLine,
                    new[] { RelationalEventId.CommandExecuted },
                    LogLevel.Warning);
            }
        });
        services.AddScoped<IStudentProjectsRepository, StudentProjectRepository>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(GetStudentProjectsCommand).Assembly);
        });
        return services;
    }
}
