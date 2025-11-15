using System.Text;
using HacatonMax.University.Auth;
using HacatonMax.University.Auth.Application.Commands.GetUserToken;
using HacatonMax.University.Auth.Domain;
using Microsoft.IdentityModel.Tokens;

namespace HacatonMax.WebHost;

public static class DependencyExtensions
{
    public static IServiceCollection AddAuthModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IJwtService, JwtService>();
        services.AddHttpContextAccessor();
        services.AddScoped<IUserContextService, UserContextService>();
        services.AddAuthentication("Bearer")
            .AddJwtBearer("Bearer", options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)
                    )
                };
            });
        services.AddAuthorization();

        services.AddMediator(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(GetUserTokenCommand).Assembly);
        });
        return services;
    }
}
