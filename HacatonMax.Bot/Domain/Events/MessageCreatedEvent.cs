namespace HacatonMax.Bot.Domain.Events;

public class MessageCreatedEvent : UpdateEvent
{
    public long ChatId { get; init; }

    public string Text { get; init; }

    public long UserId { get; init; }
}
