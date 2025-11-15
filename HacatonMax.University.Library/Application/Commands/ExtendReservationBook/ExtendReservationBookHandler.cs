using HacatonMax.Common.Abstractions;
using HacatonMax.Common.AuthHelper;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Library.Application.Commands.SendNotificationEstimatedReservationTimeBook;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ExtendReservationBook;

public class ExtendReservationBookHandler : IRequestHandler<ExtendReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;
    private readonly IJobsProvider _jobsProvider;

    public ExtendReservationBookHandler(
        IBookRepository bookRepository,
        IUserContextService userContextService,
        IJobsProvider jobsProvider)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
        _jobsProvider = jobsProvider;
    }

    public async Task Handle(ExtendReservationBookCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();

        var reservation = await _bookRepository.GetReservationBook(request.BookId, user.Id);

        if (reservation?.Book == null)
        {
            throw new NotFoundException("Нет брони или книга не найдена");
        }

        reservation.ExtendReservation();
        await _bookRepository.SaveChanges();

        var command =
            new SendNotificationEstimatedReservationTimeBookCommand(user.Id,
                DateOnly.FromDateTime(reservation.EndReservationDate.DateTime));
        await _jobsProvider.DeleteJob(command.GetJobId());

        await _jobsProvider.ScheduleJobWithTag<IMediator>(
            x => x.Send(command, cancellationToken),
            command.GetJobId(),
            reservation.EndReservationDate.AddDays(-2));
    }
}
