using System.Text.Json;
using HacatonMax.University.Library.Domain;
using HacatonMax.University.Library.Infrastructure.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace HacatonMax.University.Library.Infrastructure.Messaging;

internal sealed class BookIndexingConsumer : BackgroundService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(5);

    private readonly IConnection _connection;
    private readonly RabbitMqOptions _options;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookIndexingConsumer> _logger;
    private IModel? _channel;
    private CancellationToken _stoppingToken;

    public BookIndexingConsumer(
        IConnection connection,
        IOptions<RabbitMqOptions> options,
        IServiceScopeFactory scopeFactory,
        ILogger<BookIndexingConsumer> logger)
    {
        _connection = connection;
        _options = options.Value;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _stoppingToken = stoppingToken;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!_connection.IsOpen)
                {
                    _logger.LogWarning("Подключение к RabbitMQ закрыто. Ожидание восстановления...");
                    await Task.Delay(RetryDelay, stoppingToken);
                    continue;
                }

                _channel = _connection.CreateModel();

                _channel.QueueDeclare(
                    queue: _options.IndexingQueueName,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.Received += HandleMessageAsync;

                _channel.BasicConsume(
                    queue: _options.IndexingQueueName,
                    autoAck: false,
                    consumer: consumer);

                _logger.LogInformation("Потребитель очереди {QueueName} запущен", _options.IndexingQueueName);

                var completionSource = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);

                stoppingToken.Register(() =>
                {
                    try
                    {
                        _channel?.Close();
                        _channel?.Dispose();
                    }
                    catch (Exception exception)
                    {
                        _logger.LogWarning(
                            exception,
                            "Ошибка при остановке потребителя очереди {QueueName}",
                            _options.IndexingQueueName);
                    }

                    completionSource.TrySetResult();
                });

                await completionSource.Task;
                break;
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Ошибка при инициализации потребителя очереди {QueueName}. Повторная попытка через {Delay} секунд",
                    _options.IndexingQueueName,
                    RetryDelay.TotalSeconds);

                try
                {
                    _channel?.Close();
                    _channel?.Dispose();
                }
                catch
                {
                    // Игнорируем ошибки при закрытии канала
                }

                _channel = null;

                if (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(RetryDelay, stoppingToken);
                }
            }
        }
    }

    private async Task HandleMessageAsync(object sender, BasicDeliverEventArgs eventArgs)
    {
        if (_channel is null)
        {
            return;
        }

        var deliveryTag = eventArgs.DeliveryTag;

        try
        {
            var message = JsonSerializer.Deserialize<BookIndexingMessage>(eventArgs.Body.Span, SerializerOptions);

            if (message is null)
            {
                _logger.LogWarning("Получено пустое сообщение очереди {QueueName}", _options.IndexingQueueName);
                _channel.BasicAck(deliveryTag, multiple: false);
                return;
            }

            using var scope = _scopeFactory.CreateScope();

            var repository = scope.ServiceProvider.GetRequiredService<IBookRepository>();
            var searchService = scope.ServiceProvider.GetRequiredService<IBookSearchService>();

            switch (message.Action)
            {
                case BookIndexingAction.Index:
                    var book = await repository.GetBookById(message.BookId);

                    if (book is null)
                    {
                        var removedMissing = await searchService.Remove(message.BookId);

                        if (!removedMissing)
                        {
                            throw new InvalidOperationException($"Не удалось удалить отсутствующую книгу {message.BookId} из индекса");
                        }

                        break;
                    }

                    var indexed = await searchService.Index(book);

                    if (!indexed)
                    {
                        throw new InvalidOperationException($"Не удалось проиндексировать книгу {message.BookId}");
                    }

                    break;

                case BookIndexingAction.Remove:
                    var removed = await searchService.Remove(message.BookId);

                    if (!removed)
                    {
                        throw new InvalidOperationException($"Не удалось удалить книгу {message.BookId} из индекса");
                    }

                    break;

                default:
                    _logger.LogWarning(
                        "Получено сообщение с неподдерживаемым действием {Action} для книги {BookId}",
                        message.Action,
                        message.BookId);
                    break;
            }

            _channel.BasicAck(deliveryTag, multiple: false);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Ошибка обработки сообщения очереди переиндексации");

            if (!_stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(RetryDelay, _stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // при остановке службы не требуется повторная публикация
                }
            }

            if (_channel is { IsOpen: true })
            {
                _channel.BasicNack(deliveryTag, multiple: false, requeue: true);
            }
        }
    }
}

