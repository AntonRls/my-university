using HacatonMax.Bot.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.SendNotificationEstimatedReservationTimeBook;

public class SendNotificationEstimatedReservationTimeBookHandler : IRequestHandler<SendNotificationEstimatedReservationTimeBookCommand>
{
    private readonly IBotProvider _botProvider;

    public SendNotificationEstimatedReservationTimeBookHandler(IBotProvider botProvider)
    {
        _botProvider = botProvider;
    }

    public async Task Handle(SendNotificationEstimatedReservationTimeBookCommand request, CancellationToken cancellationToken)
    {
        await _botProvider.SendMessage(new Message
        {
            UserId = request.UserId,
            Text = $"Привет! Ты брал книгу из библиотеки, хотим напомнить, что нужно её вернуть до {request.EstimatedDate.ToString("dd.MM.yyyy")} (включительно)"
        });
    }
}
