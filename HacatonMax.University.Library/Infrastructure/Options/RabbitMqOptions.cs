namespace HacatonMax.University.Library.Infrastructure.Options;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public string Uri { get; init; } = string.Empty;

    public string? Username { get; init; }

    public string? Password { get; init; }

    public string IndexingQueueName { get; init; } = "library.books.indexing";
}
