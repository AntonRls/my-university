using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.InvertFavoriteStatusBook;

public class InvertFavoriteStatusBookHandler : IRequestHandler<InvertFavoriteStatusBookCommand>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public InvertFavoriteStatusBookHandler(
        IBookRepository bookRepository,
        IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task Handle(InvertFavoriteStatusBookCommand request, CancellationToken cancellationToken)
    {
        var user = _userContextService.GetCurrentUser();
        await _bookRepository.InvertFavoriteBookStatus(request.BookId, user.Id);
    }
}
