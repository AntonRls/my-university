using HacatonMax.Bot.Domain;
using HacatonMax.Bot.MaxProvider.Converters;
using HacatonMax.MaxClient.Bot;
using HacatonMax.MaxClient.Bot.DTO;
using Message = HacatonMax.Bot.Domain.Message;

namespace HacatonMax.Bot.MaxProvider;

public class MaxBotProvider : IBotProvider
{
    private readonly MaxBotClient _maxBotClient;
    private readonly MarkerService _markerService;

    public MaxBotProvider(
        MaxBotClient  maxBotClient,
        MarkerService markerService)
    {
        _maxBotClient = maxBotClient;
        _markerService = markerService;
    }

    public async Task<IReadOnlyCollection<UpdateEvent>> ReceiveUpdates()
    {
        var marker = await _markerService.GetMarker();
        var @event = await _maxBotClient.GetUpdates(marker);

        await _markerService.SetMarker(@event.Marker.ToString());
        return EventConverter.ToUpdatedEvents(@event);
    }

    public Task SendMessage(Message message)
    {
        return _maxBotClient.SendMessage(new MessageDto(message.UserId, message.Text));
    }
}
