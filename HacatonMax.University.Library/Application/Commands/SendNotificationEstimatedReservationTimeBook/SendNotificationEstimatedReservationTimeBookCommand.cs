using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.SendNotificationEstimatedReservationTimeBook;

public record SendNotificationEstimatedReservationTimeBookCommand(long UserId, DateOnly EstimatedDate) : IRequest
{
    public string GetJobId()
        => $"SendNotificationEstimatedReservationTimeBookCommand_{UserId}";
}
