using System.Linq.Expressions;

namespace HacatonMax.Common.Abstractions;

public interface IJobsProvider
{
    Task ScheduleJobWithTag<T>(Expression<Func<T, Task>> methodCall, string tag, DateTimeOffset? enqueueAt = null);

    Task DeleteJob(string tag);
}
