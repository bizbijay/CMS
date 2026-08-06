using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("BankAccountDebitLogs")]
public class BankAccountDebitLog
{
    [Key]
    public int Id { get; set; }

    public int BankAccountId { get; set; }
    public BankAccount? BankAccount { get; set; }

    public int? VendorId { get; set; }
    public Vendor? Vendor { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal Amount { get; set; }

    public DateOnly DebitedOn { get; set; }

    [MaxLength(500)]
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
