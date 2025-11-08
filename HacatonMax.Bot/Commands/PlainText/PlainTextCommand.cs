using HacatonMax.Bot.Domain;
using HacatonMax.Bot.Domain.Events;
using MediatR;

namespace HacatonMax.Bot.Commands.PlainText;

public record PlainTextCommand(MessageCreatedEvent Event) : IRequest;

public class PlainTextHandler : IRequestHandler<PlainTextCommand>
{
    private readonly IBotProvider _botProvider;

    public PlainTextHandler(IBotProvider botProvider)
    {
        _botProvider = botProvider;
    }

    public async Task Handle(PlainTextCommand request, CancellationToken cancellationToken)
    {
        await _botProvider.SendMessage(new Message
        {
            UserId = request.Event.UserId,
            ChatId = request.Event.ChatId,
            Text = "Привет! Тестовое сообщение"
        });
    }
}
