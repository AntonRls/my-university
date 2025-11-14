using HacatonMax.University.Structure.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace HacatonMax.University.Structure.Infrastructure.Services;

public sealed class HttpTenantContextAccessor : ITenantContextAccessor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpTenantContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public long TenantId
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext
                             ?? throw new InvalidOperationException("HttpContext is not available");

            if (httpContext.Items.TryGetValue("tenant_id", out var cached) && cached is long cachedId)
            {
                return cachedId;
            }

            if (httpContext.Request.Headers.TryGetValue("X-Tenant-Id", out var headerValue)
                && long.TryParse(headerValue.ToString(), out var tenantId))
            {
                httpContext.Items["tenant_id"] = tenantId;
                return tenantId;
            }

            if (httpContext.Request.Query.TryGetValue("tenantId", out var queryValue)
                && long.TryParse(queryValue.ToString(), out tenantId))
            {
                httpContext.Items["tenant_id"] = tenantId;
                return tenantId;
            }

            throw new InvalidOperationException("Tenant id was not provided. Use X-Tenant-Id header or tenantId query parameter.");
        }
    }
}
