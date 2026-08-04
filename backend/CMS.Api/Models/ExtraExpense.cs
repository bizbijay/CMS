using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("ExtraExpenses")]
public class ExtraExpense
{
    [Key]
    public int Id { get; set; }

    public int? ExpensedById { get; set; }
    public User? ExpensedBy { get; set; }

    [MaxLength(200)]
    public string? ExpensedByOther { get; set; }

    [Required]
    [MaxLength(200)]
    public string Item { get; set; } = string.Empty;

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Quantity { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Cost { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal TotalCost { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public bool IsVerified { get; set; } = false;

    public int? VerifiedById { get; set; }
    public User? VerifiedBy { get; set; }

    public DateTime? VerifiedAt { get; set; }

    [Required]
    public DateOnly Date { get; set; }

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
