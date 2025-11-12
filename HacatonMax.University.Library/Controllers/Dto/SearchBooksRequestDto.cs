namespace HacatonMax.University.Library.Controllers.Dto;

public sealed record SearchBooksRequestDto(
    string Query,
    List<Guid>? Tags = null,
    int Page = 1,
    int PageSize = 20);

