using HacatonMax.University.Admin.Domain;
using HacatonMax.University.Library.Controllers.Dto;
using HacatonMax.University.Library.Domain;
using TimeWarp.Mediator;

namespace HacatonMax.University.Library.Application.Commands.GetBookReservations;

public class GetBookReservationsHandler : IRequestHandler<GetBookReservationsCommand, List<BookReservationDto>>
{
    private readonly IBookRepository _bookRepository;
    private readonly IUserRepository _userRepository;

    public GetBookReservationsHandler(
        IBookRepository bookRepository,
        IUserRepository userRepository)
    {
        _bookRepository = bookRepository;
        _userRepository = userRepository;
    }

    public async Task<List<BookReservationDto>> Handle(GetBookReservationsCommand request, CancellationToken cancellationToken)
    {
        var reservations = await _bookRepository.GetBookReservations(request.BookId);
        
        if (reservations.Count == 0)
        {
            return new List<BookReservationDto>();
        }

        var userIds = reservations.Select(r => r.ReservationOwnerId).Distinct().ToList();
        var users = await _userRepository.GetUsersByIds(userIds.ToArray());
        var usersDict = users.ToDictionary(u => u.Id, u => u);

        return reservations.Select(reservation =>
        {
            var user = usersDict.GetValueOrDefault(reservation.ReservationOwnerId);
            return new BookReservationDto(
                reservation.BookId,
                reservation.ReservationOwnerId,
                user?.FirstName ?? "Неизвестно",
                user?.LastName ?? "",
                user?.Username,
                reservation.EndReservationDate,
                reservation.CountExtendReservation);
        }).ToList();
    }
}

