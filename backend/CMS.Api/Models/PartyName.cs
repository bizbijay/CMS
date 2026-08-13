using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("PartyNames")]
public class PartyName
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Type { get; set; } = "other";

    [MaxLength(500)]
    public string? Address { get; set; }

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

    public List<PartyBalanceLog> BalanceLogs { get; set; } = [];
}
