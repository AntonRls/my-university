using HacatonMax.Bot.Commands.PlainText;
using HacatonMax.Bot.Domain;
using HacatonMax.MaxClient;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.Bot.MaxProvider;

public static class DependencyExtensions
{
    public static IServiceCollection StartMaxBot(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<MarkerService>();
        services.AddDistributedMemoryCache();
        services.LoadMarker();

        services.AddMaxBotClient(
            configuration.GetValue<string>("MaxBot:BaseUrl")!,
            configuration.GetValue<string>("MaxBot:AccessToken")!);
        services.AddSingleton<IBotProvider, MaxBotProvider>();
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(PlainTextCommand).Assembly);
        });

        services.AddHostedService<BotHostedService>();
        return services;
    }

    private static void LoadMarker(this IServiceCollection services)
    {
        using var provider = services.BuildServiceProvider();
        var cache = provider.GetRequiredService<IDistributedCache>();

        if (File.Exists(MarkerService.FileName))
        {
            var marker = File.ReadAllText(MarkerService.FileName);
            cache.SetString(MarkerService.Key, marker);
        }

    }
}
