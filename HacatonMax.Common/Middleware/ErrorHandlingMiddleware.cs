using System.Net;
using System.Text.Json;
using HacatonMax.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace HacatonMax.Common.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ErrorHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, message) = ex switch
        {
            BadRequestException => (HttpStatusCode.BadRequest, ex.Message),
            NotFoundException => (HttpStatusCode.NotFound, ex.Message),
            ServiceUnavailableException => (HttpStatusCode.ServiceUnavailable, ex.Message),
            DbUpdateConcurrencyException => (HttpStatusCode.Conflict, "Данные были изменены другим пользователем. Пожалуйста, обновите страницу и попробуйте снова."),
            _ => (HttpStatusCode.InternalServerError, ex.Message)
        };

        var response = new
        {
            Success = false,
            Detail = message,
            Type = ex.GetType().Name
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        return context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
