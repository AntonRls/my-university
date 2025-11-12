using Hangfire;
using HacatonMax.University.Library.Domain;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace HacatonMax.University.Library.Infrastructure.Search;

internal sealed class BookSearchIndexInitializer(
    IBookSearchService bookSearchService,
    IRecurringJobManager recurringJobManager,
    ILogger<BookSearchIndexInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await bookSearchService.EnsureIndex();
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Не удалось подготовить индекс поиска библиотеки при запуске приложения");
            return;
        }

        try
        {
            recurringJobManager.AddOrUpdate<BookSearchReindexJob>(
                BookSearchReindexJob.JobId,
                job => job.Run(),
                Cron.Daily);

            logger.LogInformation(
                "Зарегистрирована ежедневная переиндексация библиотеки (job: {JobId})",
                BookSearchReindexJob.JobId);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Не удалось зарегистрировать переиндексацию библиотеки в Hangfire");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}

