using HacatonMax.University.Library.Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace HacatonMax.University.Library.Infrastructure.Messaging;

internal sealed class RabbitMqConnectionFactory
{
    private static readonly TimeSpan InitialRetryDelay = TimeSpan.FromSeconds(2);
    private static readonly TimeSpan MaxRetryDelay = TimeSpan.FromSeconds(30);
    private static readonly int MaxRetryAttempts = 30;

    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqConnectionFactory> _logger;

    public RabbitMqConnectionFactory(
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqConnectionFactory> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public IConnection CreateConnection()
    {
        if (string.IsNullOrWhiteSpace(_options.Uri))
        {
            throw new InvalidOperationException("Не настроен адрес RabbitMQ");
        }

        var factory = new ConnectionFactory
        {
            Uri = new Uri(_options.Uri),
            DispatchConsumersAsync = true,
            AutomaticRecoveryEnabled = true,
            TopologyRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedConnectionTimeout = TimeSpan.FromSeconds(10)
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            factory.UserName = _options.Username;
        }

        if (!string.IsNullOrWhiteSpace(_options.Password))
        {
            factory.Password = _options.Password;
        }

        var retryDelay = InitialRetryDelay;
        var attempt = 0;

        while (attempt < MaxRetryAttempts)
        {
            try
            {
                _logger.LogInformation(
                    "Попытка подключения к RabbitMQ (попытка {Attempt}/{MaxAttempts})",
                    attempt + 1,
                    MaxRetryAttempts);

                var connection = factory.CreateConnection("my-university-library-indexing");

                _logger.LogInformation("Успешное подключение к RabbitMQ");

                return connection;
            }
            catch (Exception ex)
            {
                attempt++;

                if (attempt >= MaxRetryAttempts)
                {
                    _logger.LogError(
                        ex,
                        "Не удалось подключиться к RabbitMQ после {MaxAttempts} попыток",
                        MaxRetryAttempts);
                    throw;
                }

                _logger.LogWarning(
                    ex,
                    "Ошибка подключения к RabbitMQ. Повторная попытка через {Delay} секунд",
                    retryDelay.TotalSeconds);

                Thread.Sleep(retryDelay);

                retryDelay = TimeSpan.FromSeconds(Math.Min(retryDelay.TotalSeconds * 1.5, MaxRetryDelay.TotalSeconds));
            }
        }

        throw new InvalidOperationException("Не удалось подключиться к RabbitMQ");
    }
}

