using HacatonMax.University.StudentsProject.Application.Commands.GetStudentProjects;
using HacatonMax.University.StudentsProject.Domain;
using HacatonMax.University.StudentsProject.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.University.StudentsProject;

public static class DependencyExtensions
{
    public static IServiceCollection AddUniversityStudentProjectsModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<StudentProjectsDbContext>(options =>
        {
            options.UseNpgsql(configuration.GetConnectionString("Postgres"));
        });
        services.AddScoped<IStudentProjectsRepository, StudentProjectRepository>();
        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(GetStudentProjectsCommand).Assembly);
        });
        return services;
    }
}
