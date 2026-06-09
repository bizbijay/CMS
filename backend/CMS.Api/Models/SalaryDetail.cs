using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("SalaryDetails")]
public class SalaryDetail
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public decimal TotalSalary { get; set; }
    public decimal Paid { get; set; }
    public decimal Remaining { get; set; }
}
