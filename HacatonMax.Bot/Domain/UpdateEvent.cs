namespace HacatonMax.Bot.Domain;

public class UpdateEvent
{
    public UpdateType UpdateType { get; init; }
}

public enum UpdateType
{
    MessageCreated
}
