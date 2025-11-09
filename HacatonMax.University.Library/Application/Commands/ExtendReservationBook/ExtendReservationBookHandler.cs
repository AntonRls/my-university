using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ExtendReservationBook;

public class ExtendReservationBookHandler : IRequestHandler<ExtendReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public ExtendReservationBookHandler(
        IBookRepository bookRepository,
        IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
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
    }
}
