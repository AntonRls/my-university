using HacatonMax.Bot.Domain;
using HacatonMax.Bot.Domain.Events;
using HacatonMax.MaxClient.Bot.DTO;
using UpdateType = HacatonMax.MaxClient.Bot.DTO.UpdateType;

namespace HacatonMax.Bot.MaxProvider.Converters;

public static class EventConverter
{
    public static IReadOnlyCollection<UpdateEvent> ToUpdatedEvents(UpdatesDto @event)
    {
        var result = new List<UpdateEvent>();

        foreach (var update in @event.Updates)
        {
            if (update.UpdateType == UpdateType.MessageCreated)
            {
                result.Add(ToMessageCreatedEvent(update));
            }
        }

        return result;
    }

    private static MessageCreatedEvent ToMessageCreatedEvent(UpdateDto @event)
    {
        return new MessageCreatedEvent
        {
            UserId = @event.Message.Sender.UserId,
            ChatId = @event.Message.Recipient.ChatId,
            Text = @event.Message.Body.Text
        };
    }
}
