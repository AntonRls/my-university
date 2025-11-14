using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Mvc;

namespace HacatonMax.WebHost.Controllers;

[ApiController]
[Route("metrics")]
public class MetricsController : ControllerBase
{
    private static readonly Meter Meter = new("HacatonMax.WebHost", "1.0.0");

    [HttpGet]
    public IActionResult GetMetrics()
    {
        // Simple metrics endpoint - returns basic info
        // For full Prometheus export, consider using prometheus-net package
        var metrics = new
        {
            message = "Metrics are being collected. Use a metrics exporter (e.g., prometheus-net) for full Prometheus format.",
            available_metrics = new[]
            {
                "http_requests_total - Total number of HTTP requests",
                "http_request_duration_seconds - HTTP request duration in seconds"
            },
            note = "Metrics are exposed via System.Diagnostics.Metrics. Use a metrics listener to collect them."
        };

        return Ok(metrics);
    }
}

