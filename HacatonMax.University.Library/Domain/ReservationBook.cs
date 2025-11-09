using HacatonMax.Common.Exceptions;

namespace HacatonMax.University.Library.Domain;

public class ReservationBook
{
    public long BookId { get; private set; }

    public Book Book { get; private set; }

    public long ReservationOwnerId { get; private set; }

    public DateTimeOffset EndReservationDate { get; private set; }

    public int CountExtendReservation { get; private set; }

    public ReservationBook(long bookId, long reservationOwnerId, DateTimeOffset endReservationDate)
    {
        BookId = bookId;
        ReservationOwnerId = reservationOwnerId;
        EndReservationDate = endReservationDate;
        CountExtendReservation = 0;
    }

    public void ExtendReservation()
    {
        if (CountExtendReservation >= 3)
        {
            throw new BadRequestException($"Вы превысили лимит продления брони. Пожалуйста, верните книгу до {EndReservationDate:dd.MM.yyyy}");
        }

        EndReservationDate = EndReservationDate.AddDays(7);
        CountExtendReservation++;
    }

    private ReservationBook()
    {
    }
}
