using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.WebHost;

public static class MetricsExtensions
{
    public static IServiceCollection AddRequestMetrics(this IServiceCollection services)
    {
        return services;
    }

    public static IApplicationBuilder UseRequestMetrics(this IApplicationBuilder app)
    {
        return app.UseMiddleware<MetricsMiddleware>();
    }
}

