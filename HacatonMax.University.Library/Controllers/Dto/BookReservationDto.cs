namespace HacatonMax.University.Library.Controllers.Dto;

public record BookReservationDto(
    long BookId,
    long ReservationOwnerId,
    string OwnerFirstName,
    string OwnerLastName,
    string? OwnerUsername,
    DateTimeOffset EndReservationDate,
    int CountExtendReservation);

