using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class SalaryPaymentListItem
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly PaidOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSalaryPaymentRequest
{
    [Required] public int UserId { get; set; }
    [Required, Range(0, double.MaxValue)] public decimal Amount { get; set; }
    [Required] public DateOnly PaidOn { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateSalaryPaymentRequest
{
    [Required] public int UserId { get; set; }
    [Required, Range(0, double.MaxValue)] public decimal Amount { get; set; }
    [Required] public DateOnly PaidOn { get; set; }
    public string? Remarks { get; set; }
}
