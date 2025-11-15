using HacatonMax.Common.AuthHelper;
using HacatonMax.University.Deadlines.Application.Services;
using HacatonMax.University.Deadlines.Infrastructure;
using TimeWarp.Mediator;

namespace HacatonMax.University.Deadlines.Application.Commands.DeleteDeadline;

public sealed record DeleteDeadlineCommand(long DeadlineId) : IRequest;

public sealed class DeleteDeadlineCommandHandler : IRequestHandler<DeleteDeadlineCommand>
{
    private readonly DeadlinesDbContext _deadlinesDbContext;
    private readonly IUserContextService _userContextService;
    private readonly IDeadlineNotificationService _notificationService;

    public DeleteDeadlineCommandHandler(
        DeadlinesDbContext deadlinesDbContext,
        IUserContextService userContextService,
        IDeadlineNotificationService notificationService)
    {
        _deadlinesDbContext = deadlinesDbContext;
        _userContextService = userContextService;
        _notificationService = notificationService;
    }

    public async Task Handle(DeleteDeadlineCommand request, CancellationToken cancellationToken)
    {
        var deadline = await _deadlinesDbContext.Deadlines.FindAsync(new object?[] { request.DeadlineId }, cancellationToken);

        if (deadline is null)
        {
            return;
        }

        _ = _userContextService.GetCurrentUser();
        deadline.Delete();
        await _deadlinesDbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.HandleDeadlineDeleted(deadline.Id, cancellationToken);

        return;
    }
}

