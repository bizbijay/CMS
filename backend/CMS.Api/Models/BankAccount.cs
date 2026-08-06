using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

public interface IPrimaryAccountState
{
    int Id { get; }
    bool IsPrimary { get; set; }
}

[Table("BankAccounts")]
public class BankAccount : IPrimaryAccountState
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string BankName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string AccountHolder { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string AccountNumber { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Branch { get; set; }

    public bool IsPrimary { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal TotalBalance { get; set; } = 0m;

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

    public List<BankAccountCreditLog> CreditLogs { get; set; } = [];
    public List<BankAccountDebitLog> DebitLogs { get; set; } = [];
}
