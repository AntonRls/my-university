using HacatonMax.Common.Abstractions;
using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Application.Commands.SendNotificationEstimatedReservationTimeBook;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ReservationBook;

public class ReservationBookHandler : IRequestHandler<ReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;
    private readonly IJobsProvider _jobsProvider;
    private readonly IBookSearchService _bookSearchService;

    public ReservationBookHandler(
        IBookRepository bookRepository,
        IUserContextService  userContextService,
        IJobsProvider jobsProvider,
        IBookSearchService bookSearchService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
        _jobsProvider = jobsProvider;
        _bookSearchService = bookSearchService;
    }

    public async Task Handle(ReservationBookCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();

        var reservationBook = await _bookRepository.GetReservationBook(request.BookId, user.Id);

        if (reservationBook != null)
        {
            throw new BadRequestException("Вы уже забронировали эту книгу");
        }

        var book = await _bookRepository.GetBookById(request.BookId);
        if (book == null)
        {
            throw new NotFoundException("Книга не найдена");
        }

        book.Take();

        var reservation = await _bookRepository.ReservationBook(request.BookId, user.Id);
        await _bookSearchService.Index(book);

        var command = new SendNotificationEstimatedReservationTimeBookCommand(user.Id,
            DateOnly.FromDateTime(reservation.EndReservationDate.Date));
        await _jobsProvider.ScheduleJobWithTag<IMediator>(
            x => x.Send(command, cancellationToken),
            command.GetJobId(),
            reservation.EndReservationDate.AddDays(-2));
    }
}
