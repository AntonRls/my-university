namespace HacatonMax.University.Library.Controllers.Dto;

public sealed record SearchBooksResponseDto(
    long Total,
    int Page,
    int PageSize,
    List<BookDto> Books);

