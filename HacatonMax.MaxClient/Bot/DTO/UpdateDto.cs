namespace HacatonMax.MaxClient.Bot.DTO;

public class UpdateDto
{
    public Message Message { get; init; }
    public UpdateType UpdateType { get; init; }
}

public enum UpdateType
{
    MessageCreated
}

public class Message
{
    public MessageRecipient Recipient { get; init; }
    public MessageBody Body { get; init; }
}

public class MessageRecipient
{
    public long ChatId { get; init; }
    public long UserId { get; init; }
}

public class MessageBody
{
    public string Text { get; init; }
}
