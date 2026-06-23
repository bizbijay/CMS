using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("ProjectExpenses")]
public class ProjectExpense
{
    [Key]
    public int Id { get; set; }

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? MaterialId { get; set; }
    public Material? Material { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Quantity { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? CostPerUnit { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TotalCost { get; set; }

    public int? VendorId { get; set; }
    public Vendor? Vendor { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    [Required]
    public DateOnly Date { get; set; }

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
