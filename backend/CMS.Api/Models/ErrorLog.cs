using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("ErrorLogs")]
public class ErrorLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Message { get; set; } = string.Empty;

    public string? ExceptionType { get; set; }

    public string? StackTrace { get; set; }

    public string? Source { get; set; }

    [MaxLength(500)]
    public string? RequestPath { get; set; }

    [MaxLength(10)]
    public string? RequestMethod { get; set; }

    [MaxLength(1000)]
    public string? QueryString { get; set; }

    public int StatusCode { get; set; } = 500;

    [MaxLength(500)]
    public string? UserAgent { get; set; }

    [MaxLength(50)]
    public string? ClientIp { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
