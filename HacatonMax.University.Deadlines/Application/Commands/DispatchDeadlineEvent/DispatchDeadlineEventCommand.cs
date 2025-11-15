using HacatonMax.Bot.Domain;
using HacatonMax.University.Deadlines.Domain;
using HacatonMax.University.Deadlines.Infrastructure;
using HacatonMax.University.Structure.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.DispatchDeadlineEvent;

public sealed record DispatchDeadlineEventCommand(long DeadlineId, long ActorUserId, DeadlineEventType EventType) : IRequest;

public enum DeadlineEventType
{
    Created,
    Updated
}

public sealed class DispatchDeadlineEventCommandHandler : IRequestHandler<DispatchDeadlineEventCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly StructureDbContext _structureDbContext;
    private readonly IBotProvider _botProvider;
    private readonly ILogger<DispatchDeadlineEventCommandHandler> _logger;

    public DispatchDeadlineEventCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        StructureDbContext structureDbContext,
        IBotProvider botProvider,
        ILogger<DispatchDeadlineEventCommandHandler> logger)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _structureDbContext = structureDbContext;
        _botProvider = botProvider;
        _logger = logger;
    }

    public async Task Handle(DispatchDeadlineEventCommand request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.DeadlineId, cancellationToken);

        if (deadline is null)
        {
            return;
        }

        var recipients = await _structureDbContext.GroupMembers
            .Where(member => member.GroupId == deadline.GroupId && member.StudentId != request.ActorUserId)
            .Select(member => member.StudentId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (recipients.Count == 0)
        {
            return;
        }

        var dueAt = deadline.DueAt.ToString("dd.MM.yyyy HH:mm");
        var action = request.EventType switch
        {
            DeadlineEventType.Updated => "обновлен",
            _ => "создан"
        };

        var message = $"Дедлайн \"{deadline.Title}\" {action}. Сдать до {dueAt}.";

        foreach (var userId in recipients)
        {
            try
            {
                await _botProvider.SendMessage(new Message
                {
                    UserId = userId,
                    Text = message
                });
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Failed to send deadline event message to {UserId}", userId);
            }
        }
    }
}


