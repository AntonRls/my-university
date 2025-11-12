namespace HacatonMax.University.Library.Infrastructure.Options;

public sealed class ElasticsearchOptions
{
    public const string SectionName = "Elasticsearch";

    public string Uri { get; init; } = string.Empty;

    public string IndexName { get; init; } = "library-books";

    public string? Username { get; init; }

    public string? Password { get; init; }

    public int RequestTimeoutSeconds { get; init; } = 5;
}

