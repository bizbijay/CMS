using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class MonthlySalaryRowDto
{
    public int? Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal DefaultSalary { get; set; }
    public decimal Amount { get; set; }
    public bool IsVerified { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}

public class VerifyAllRequest
{
    [Required, Range(1, 12)]
    public int Month { get; set; }

    [Required, Range(2000, 2100)]
    public int Year { get; set; }
}

public class SaveMonthlySalaryRequest
{
    [Required]
    public int UserId { get; set; }

    [Required, Range(1, 12)]
    public int Month { get; set; }

    [Required, Range(2000, 2100)]
    public int Year { get; set; }

    [Required, Range(0, double.MaxValue)]
    public decimal Amount { get; set; }

    public bool IsVerified { get; set; }
}
