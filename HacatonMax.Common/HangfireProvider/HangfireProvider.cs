using System.Linq.Expressions;
using HacatonMax.Common.Abstractions;
using Hangfire;
using Hangfire.States;

namespace HacatonMax.Common.HangfireProvider;

public class HangfireProvider : IJobsProvider
{
    public const string JobIdKey = "MyUniversity-JobId";

    private readonly JobStorage _jobStorage;
    private readonly IBackgroundJobClient _backgroundJobClient;

    public HangfireProvider(
        JobStorage jobStorage,
        IBackgroundJobClient backgroundJobClient)
    {
        _jobStorage = jobStorage;
        _backgroundJobClient = backgroundJobClient;
    }

    public Task ScheduleJobWithTag<T>(Expression<Func<T, Task>> methodCall, string tag, DateTimeOffset? enqueueAt = null)
    {
        enqueueAt ??= DateTime.UtcNow;
        Schedule(tag, methodCall, new ScheduledState(enqueueAt.Value.ToUniversalTime().DateTime));
        return Task.CompletedTask;
    }

    public Task DeleteJob(string tag)
    {
        Deschedule(tag);
        return Task.CompletedTask;
    }

    private void Schedule<T>(string jobId, Expression<Func<T, Task>> methodCall, ScheduledState state)
    {
        using var connection = _jobStorage.GetConnection();

        var hangfireJobId = _backgroundJobClient.Create(
            methodCall,
            state);

        connection.SetRangeInHash(jobId, new List<KeyValuePair<string, string>>
        {
            new (JobIdKey, hangfireJobId)
        });
    }

    public void Deschedule(string jobId)
    {
        if (TryDeleteHash(jobId, out var hangfireJobId))
        {
            BackgroundJob.Delete(hangfireJobId);
        }
    }

    private bool TryDeleteHash(string id, out string? hangfireJobId)
    {
        hangfireJobId = null;

        using var connection = _jobStorage.GetConnection();

        Dictionary<string, string> items = connection.GetAllEntriesFromHash(id);

        if (items != null && items.TryGetValue(JobIdKey, out hangfireJobId))
        {
            using var transaction = connection.CreateWriteTransaction();

            transaction.RemoveHash(id);
            transaction.Commit();

            return true;
        }

        return false;
    }
}
