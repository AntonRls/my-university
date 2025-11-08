using Microsoft.Extensions.Caching.Distributed;

namespace HacatonMax.Bot.MaxProvider;

public class MarkerService
{
    public const string FileName = "marker.txt";
    public const string Key = "marker";

    private readonly IDistributedCache _cache;

    public MarkerService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task SetMarker(string value)
    {
        await _cache.SetStringAsync(Key, value);
        await File.WriteAllTextAsync(FileName, value);
    }

    public async Task<string?> GetMarker()
    {
        return await _cache.GetStringAsync(Key);
    }
}
