using System.Net;
using System.Security.Claims;
using System.Text.Json;
using CMS.Api.Data;
using CMS.Api.Models;

namespace CMS.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger,
        IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred while processing request {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        int statusCode = (int)HttpStatusCode.InternalServerError;
        string userMessage = "An unexpected error occurred. Please try again later.";

        // Handle specific exception types if needed
        if (exception is KeyNotFoundException)
        {
            statusCode = (int)HttpStatusCode.NotFound;
            userMessage = exception.Message;
        }
        else if (exception is UnauthorizedAccessException)
        {
            statusCode = (int)HttpStatusCode.Unauthorized;
            userMessage = "Unauthorized access.";
        }
        else if (exception is ArgumentException || exception is InvalidOperationException)
        {
            // Optional: retain custom message for domain logic exceptions if safe
            // userMessage = exception.Message;
        }

        int? errorLogId = null;

        try
        {
            // Log to database using a dedicated scope to avoid DbContext state conflicts
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var userIdClaim = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

            string? clientIp = context.Connection.RemoteIpAddress?.ToString();
            if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                clientIp = forwardedFor.ToString().Split(',')[0].Trim();
            }

            var errorLog = new ErrorLog
            {
                Message = exception.Message,
                ExceptionType = exception.GetType().FullName,
                StackTrace = exception.StackTrace,
                Source = exception.Source,
                RequestPath = context.Request.Path,
                RequestMethod = context.Request.Method,
                QueryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : null,
                StatusCode = statusCode,
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                ClientIp = clientIp,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            db.ErrorLogs.Add(errorLog);
            await db.SaveChangesAsync();
            errorLogId = errorLog.Id;
        }
        catch (Exception dbEx)
        {
            Console.WriteLine($"[GlobalExceptionMiddleware Error] Failed to save error log to DB: {dbEx.Message} | StackTrace: {dbEx.StackTrace}");
            _logger.LogError(dbEx, "Failed to persist exception log to ErrorLogs database table.");
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var responsePayload = new
        {
            statusCode,
            message = userMessage,
            errorId = errorLogId,
            timestamp = DateTime.UtcNow
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(responsePayload, options));
    }
}
