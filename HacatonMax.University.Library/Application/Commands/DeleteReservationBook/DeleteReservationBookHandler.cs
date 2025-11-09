using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.DeleteReservationBook;

public class DeleteReservationBookHandler : IRequestHandler<DeleteReservationBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public DeleteReservationBookHandler(IBookRepository bookRepository, IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(DeleteReservationBookCommand request, CancellationToken cancellationToken)
    {
        var book = await _bookRepository.GetBookById(request.BookId);

        if (book == null)
        {
            return;
        }

        book.GiveAway();

        await _bookRepository.DeleteReservation(request.BookId, _userContextService.GetCurrentUser().Id);
        await _bookRepository.SaveChanges();
    }
}
