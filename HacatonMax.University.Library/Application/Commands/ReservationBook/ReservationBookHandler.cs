using HacatonMax.Common.Exceptions;
using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.ReservationBook;

public class ReservationBookHandler : IRequestHandler<ReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public ReservationBookHandler(IBookRepository bookRepository, IUserContextService  userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
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

        await _bookRepository.ReservationBook(request.BookId, user.Id);
    }
}
