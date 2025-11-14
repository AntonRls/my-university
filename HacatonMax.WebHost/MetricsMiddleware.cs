using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Http;

namespace HacatonMax.WebHost;

public class MetricsMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly Meter Meter = new("HacatonMax.WebHost", "1.0.0");
    private static readonly Counter<long> RequestCounter = Meter.CreateCounter<long>(
        "http_requests_total",
        "requests",
        "Total number of HTTP requests");
    private static readonly Histogram<double> RequestDuration = Meter.CreateHistogram<double>(
        "http_request_duration_seconds",
        "seconds",
        "HTTP request duration in seconds");

    public MetricsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var route = context.Request.Path.Value ?? "unknown";
        var method = context.Request.Method;

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var duration = stopwatch.Elapsed.TotalSeconds;
            
            var tags = new TagList
            {
                { "method", method },
                { "route", route },
                { "status_code", context.Response.StatusCode.ToString() }
            };

            RequestCounter.Add(1, tags);
            RequestDuration.Record(duration, tags);
        }
    }
}

