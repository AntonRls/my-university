namespace HacatonMax.University.Library.Controllers.Dto;

public record BookDto(
    long Id,
    string Title,
    string? Description,
    long Count,
    long TakeCount,
    List<TagDto> Tags);
