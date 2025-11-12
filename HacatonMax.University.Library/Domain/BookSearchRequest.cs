using System.Collections.Generic;

namespace HacatonMax.University.Library.Domain;

public sealed record BookSearchRequest(
    string Query,
    IReadOnlyCollection<Guid>? TagIds,
    int Page,
    int PageSize);

