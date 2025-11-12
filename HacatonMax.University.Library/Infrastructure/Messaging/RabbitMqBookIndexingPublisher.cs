using System.Text.Json;
using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace HacatonMax.University.Library.Infrastructure.Messaging;

internal sealed class RabbitMqBookIndexingPublisher : IBookIndexingPublisher
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly IConnection _connection;
    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqBookIndexingPublisher> _logger;

    public RabbitMqBookIndexingPublisher(
        IConnection connection,
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqBookIndexingPublisher> logger)
    {
        _connection = connection;
        _options = options.Value;
        _logger = logger;
    }

    public Task PublishIndex(long bookId, CancellationToken cancellationToken = default)
    {
        return Publish(new BookIndexingMessage(bookId, BookIndexingAction.Index), cancellationToken);
    }

    public Task PublishRemove(long bookId, CancellationToken cancellationToken = default)
    {
        return Publish(new BookIndexingMessage(bookId, BookIndexingAction.Remove), cancellationToken);
    }

    private Task Publish(BookIndexingMessage message, CancellationToken cancellationToken)
    {
        try
        {
            using var channel = _connection.CreateModel();

            channel.QueueDeclare(
                queue: _options.IndexingQueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null);

            var payload = JsonSerializer.SerializeToUtf8Bytes(message, SerializerOptions);
            var properties = channel.CreateBasicProperties();
            properties.Persistent = true;

            channel.BasicPublish(
                exchange: string.Empty,
                routingKey: _options.IndexingQueueName,
                basicProperties: properties,
                body: payload);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Не удалось опубликовать событие переиндексации книги {BookId}",
                message.BookId);
        }

        return Task.CompletedTask;
    }
}

