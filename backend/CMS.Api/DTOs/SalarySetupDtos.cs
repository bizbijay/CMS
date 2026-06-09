using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class SalarySetupListItemDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal MonthlySalary { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateSalarySetupRequest
{
    [Required]
    public int UserId { get; set; }

    [Required, Range(0, double.MaxValue, ErrorMessage = "Monthly salary must be a positive value.")]
    public decimal MonthlySalary { get; set; }
}

public class UpdateSalarySetupRequest
{
    [Required]
    public int UserId { get; set; }

    [Required, Range(0, double.MaxValue, ErrorMessage = "Monthly salary must be a positive value.")]
    public decimal MonthlySalary { get; set; }
}
