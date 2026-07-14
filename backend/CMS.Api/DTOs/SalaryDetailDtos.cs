namespace CMS.Api.DTOs;

public class SalaryDetailDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal TotalSalary { get; set; }
    public decimal Paid { get; set; }
    public decimal Remaining { get; set; }
}

public class SalaryBreakdownDto
{
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal TotalFromMonthlySalaries { get; set; }
    public decimal TotalFromWages { get; set; }
    public decimal GrandTotal { get; set; }
    public IEnumerable<MonthlySalaryBreakdownItem> MonthlySalaries { get; set; } = [];
    public IEnumerable<WageBreakdownItem> Wages { get; set; } = [];
}

public class MonthlySalaryBreakdownItem
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; }
    public bool IsVerified { get; set; }
}

public class WageBreakdownItem
{
    public int TransportationId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Wages { get; set; }
    public string? ProjectName { get; set; }
    public string? VendorName { get; set; }
    public int? OperatedTimeMs { get; set; }
    public decimal? StartMeter { get; set; }
    public decimal? EndMeter { get; set; }
    public decimal? TotalMeterRun { get; set; }
}
