using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("SalaryPayments")]
public class SalaryPayment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateOnly PaidOn { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }
    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedOn { get; set; }
    public int? DeletedById { get; set; }
    public User? DeletedBy { get; set; }
}
