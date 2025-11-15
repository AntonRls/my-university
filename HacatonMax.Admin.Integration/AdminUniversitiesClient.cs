using HacatonMax.Admin.Integration.Models;
using Microsoft.Extensions.Configuration;

namespace HacatonMax.Admin.Integration;

public class AdminUniversitiesClient
{
    private readonly HttpClient _client;

    public AdminUniversitiesClient(IConfiguration configuration)
    {
        _client = new HttpClient();
        _client.BaseAddress = new Uri(configuration["AdminUniversities:BaseAddress"]);
    }

    public async Task UpdateStatusWithUser(long userId, long universityId, ApproveStatus status)
    {
        await _client.PostAsync(
            $"/users/{userId}/universities/{universityId}?status={status.ToString()}",
            null);
    }
}
