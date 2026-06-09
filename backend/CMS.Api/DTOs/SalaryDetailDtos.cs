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
