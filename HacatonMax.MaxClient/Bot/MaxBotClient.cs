using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HacatonMax.MaxClient.Bot.DTO;
using HacatonMax.MaxClient.Utils;

namespace HacatonMax.MaxClient.Bot;

public class MaxBotClient
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonSerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower) }
    };

    public MaxBotClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<UpdatesDto> GetUpdates(string? marker = null)
    {
        var events = await _httpClient.GetFromJsonAsync<UpdatesDto>($"updates?marker={marker ?? string.Empty}", _jsonSerializerOptions);
        return events!;
    }

    public Task SendMessage(MessageDto message)
    {
        return _httpClient.PostAsJsonAsync($"messages?user_id={message.UserId}&chat_id={message.ChatId}", message, _jsonSerializerOptions);
    }
}
