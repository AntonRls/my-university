using HacatonMax.University.Deadlines.Domain;

namespace HacatonMax.University.Deadlines.Application.Services;

public interface IDeadlineNotificationService
{
    Task HandleDeadlineCreated(Deadline deadline, long actorUserId, CancellationToken cancellationToken);

    Task HandleDeadlineUpdated(Deadline deadline, long actorUserId, CancellationToken cancellationToken);

    Task HandleDeadlineDeleted(long deadlineId, CancellationToken cancellationToken);
}


