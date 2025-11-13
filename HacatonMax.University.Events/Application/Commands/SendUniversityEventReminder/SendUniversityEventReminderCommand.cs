using TimeWarp.Mediator;

namespace HacatonMax.University.Events.Application.Commands.SendUniversityEventReminder;

public readonly record struct SendUniversityEventReminderCommand(long EventId, long UserId) : IRequest
{
    public string GetJobId()
        => BuildJobId(EventId, UserId);

    public static string BuildJobId(long eventId, long userId)
        => $"SendUniversityEventReminderCommand_{eventId}_{userId}";
}

