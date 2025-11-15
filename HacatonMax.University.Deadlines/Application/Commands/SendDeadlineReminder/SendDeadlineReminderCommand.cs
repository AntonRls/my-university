using HacatonMax.Bot.Domain;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.SendDeadlineReminder;

public sealed record SendDeadlineReminderCommand(long DeadlineId, string Offset) : IRequest
{
    public static string BuildJobId(long deadlineId, DeadlineReminderOffset offset)
    {
        return $"deadline:{deadlineId}:reminder:{offset}";
    }
}

public sealed class SendDeadlineReminderCommandHandler : IRequestHandler<SendDeadlineReminderCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IBotProvider _botProvider;
    private readonly ILogger<SendDeadlineReminderCommandHandler> _logger;

    public SendDeadlineReminderCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IBotProvider botProvider,
        ILogger<SendDeadlineReminderCommandHandler> logger)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _botProvider = botProvider;
        _logger = logger;
    }

    public async Task Handle(SendDeadlineReminderCommand request, CancellationToken cancellationToken)
    {
        var offset = Enum.Parse<DeadlineReminderOffset>(request.Offset, true);

        var deadline = await _deadlinesDbContext.Deadlines
            .Include(x => x.Completions)
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null || deadline.Status == DeadlineStatus.Cancelled)
        {
            return;
        }

        var recipients = await _structureDbContext.GroupMembers
            .Where(member => member.GroupId == deadline.GroupId)
            .Select(member => member.StudentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var completed = deadline.Completions.Select(x => x.UserId).ToHashSet();
        var pendingRecipients = recipients.Where(userId => !completed.Contains(userId)).ToList();

        if (pendingRecipients.Count == 0)
        {
            return;
        }

        var dueAt = deadline.DueAt.ToString("dd.MM.yyyy HH:mm");
        var text = $"Напоминание: дедлайн \"{deadline.Title}\" нужно сдать до {dueAt}.";

        foreach (var userId in pendingRecipients)
        {
            try
            {
                await _botProvider.SendMessage(new Message
                {
                    UserId = userId,
                    Text = text
                });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to send deadline reminder to {UserId}", userId);
            }
        }

        var reminder = await _deadlinesDbContext.DeadlineReminders
            .FirstOrDefaultAsync(x => x.DeadlineId == deadline.Id && x.Offset == offset, cancellationToken);

        reminder?.MarkSent();
        deadline.TouchNotification();
        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
    }
}


