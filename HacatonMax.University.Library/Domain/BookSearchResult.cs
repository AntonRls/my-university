using System.Collections.Generic;

namespace HacatonMax.University.Library.Domain;

public sealed record BookSearchResult(
    IReadOnlyCollection<BookSearchItem> Items,
    long Total,
    int Page,
    int PageSize);

public sealed record BookSearchItem(
    long Id,
    string Title,
    string? Description,
    string? Author,
    long Count,
    long TakeCount,
    IReadOnlyCollection<Tag> Tags,
    double Score);

