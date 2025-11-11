using HacatonMax.University.Auth.Domain;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetMyReservations;

public class GetMyReservationsHandler : IRequestHandler<GetMyReservationsCommand, List<ReservationDto>>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserContextService _userContextService;

    public GetMyReservationsHandler(IBookRepository bookRepository, IUserContextService userContextService)
    {
        _bookRepository = bookRepository;
        _userContextService = userContextService;
    }

    public async Task<List<ReservationDto>> Handle(GetMyReservationsCommand request, CancellationToken cancellationToken)
    {
        var userReservations = await _bookRepository.GetUserReservations(_userContextService.GetCurrentUser().Id);

        var userFavoritesBooks = await _bookRepository.GetUserFavoriteBooks(_userContextService.GetCurrentUser().Id);

        return userReservations.Select(x => new ReservationDto(x.EndReservationDate,
            new BookDto(
                x.Book.Id,
                x.Book.Title,
                x.Book.Description,
                x.Book.Count,
                x.Book.TakeCount,
                userFavoritesBooks.Contains(x.Book.Id),
                x.Book.Author,
                x.Book.Tags.Select(x => new TagDto(x.Id, x.Name)).ToList()))).ToList();
    }
}
