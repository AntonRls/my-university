using HacatonMax.Bot.Commands.PlainText;
using HacatonMax.Bot.Domain;
using HacatonMax.Bot.Domain.Events;
using MediatR;
using Microsoft.Extensions.Hosting;

namespace HacatonMax.Bot;

public class BotHostedService : BackgroundService
{
    private readonly IBotProvider _botProvider;
    private readonly IMediator _mediator;

    public BotHostedService(IBotProvider botProvider, IMediator mediator)
    {
        _botProvider = botProvider;
        _mediator = mediator;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var updates = await _botProvider.ReceiveUpdates();
                await ProcessUpdates(updates);
            }
            catch(Exception ex)
            {
                Console.WriteLine(ex);
            }
        }
    }

    private async Task ProcessUpdates(IReadOnlyCollection<UpdateEvent> updates)
    {
        var tasks = new List<Task>();
        foreach (var update in updates)
        {
            if (update.UpdateType == UpdateType.MessageCreated)
            {
                tasks.Add(_mediator.Send(new PlainTextCommand((update as MessageCreatedEvent)!)));
            }
        }

        await Task.WhenAll(tasks.ToArray());
    }
}
