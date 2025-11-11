using HacatonMax.Bot.Domain;
using HacatonMax.Bot.Domain.Events;
using TimeWarp.Mediator;

namespace HacatonMax.Bot.Application.Commands.PlainText;

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
            Text = "Привет! Тестовое сообщение"
        });
    }
}
