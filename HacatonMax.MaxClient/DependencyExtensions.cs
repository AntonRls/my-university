using HacatonMax.MaxClient.Bot;
using Microsoft.Extensions.DependencyInjection;

namespace HacatonMax.MaxClient;

public static class DependencyExtensions
{
    public static IServiceCollection AddMaxBotClient(this IServiceCollection services, string baseBotApiUrl, string accessToken)
    {
        services.AddHttpClient<MaxBotClient>(client =>
        {
            client.BaseAddress = new Uri(baseBotApiUrl);
            client.DefaultRequestHeaders.Add("Authorization", accessToken);
        });

        return services;
    }
}
