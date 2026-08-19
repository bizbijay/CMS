namespace CMS.Api.DTOs;

public class ErrorLogDto
{
    public int Id { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ExceptionType { get; set; }
    public string? StackTrace { get; set; }
    public string? Source { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public string? QueryString { get; set; }
    public int StatusCode { get; set; }
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
    public int? UserId { get; set; }
    public string? UserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateErrorLogDto
{
    public string Message { get; set; } = string.Empty;
    public string? ExceptionType { get; set; }
    public string? StackTrace { get; set; }
    public string? Source { get; set; }
    public string? RequestPath { get; set; }
    public string? RequestMethod { get; set; }
    public string? QueryString { get; set; }
    public int StatusCode { get; set; } = 500;
    public string? UserAgent { get; set; }
    public string? ClientIp { get; set; }
    public int? UserId { get; set; }
}
