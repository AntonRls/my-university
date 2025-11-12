using HacatonMax.Common.Abstractions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Application.Commands.SendNotificationEstimatedReservationTimeBook;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.DeleteReservationBook;

public class DeleteReservationBookHandler : IRequestHandler<DeleteReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;
    private readonly IJobsProvider _jobsProvider;
    private readonly IBookSearchService _bookSearchService;

    public DeleteReservationBookHandler(
        IBookRepository bookRepository,
        IUserContextService userContextService,
        IJobsProvider jobsProvider,
        IBookSearchService bookSearchService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
        _jobsProvider = jobsProvider;
        _bookSearchService = bookSearchService;
    }

    public async Task Handle(DeleteReservationBookCommand request, CancellationToken cancellationToken)
    {
        var book = await _bookRepository.GetBookById(request.BookId);

        var user = _userContextService.GetCurrentUser();

        if (book == null)
        {
            return;
        }

        book.GiveAway();

        var reservation = await _bookRepository.GetReservationBook(book.Id, user.Id);

        if (reservation == null)
        {
            return;
        }

        await _bookRepository.DeleteReservation(request.BookId, user.Id);
        await _bookRepository.SaveChanges();
        await _bookSearchService.Index(book);

        var command =
            new SendNotificationEstimatedReservationTimeBookCommand(user.Id,
                DateOnly.FromDateTime(reservation.EndReservationDate.DateTime));
        await _jobsProvider.DeleteJob(command.GetJobId());
    }
}
