using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("Transportations")]
public class Transportation
{
    [Key]
    public int Id { get; set; }

    // Either TransportedById (FK) or TransportedByOther (free text) must be set
    public int? TransportedById { get; set; }
    public User? TransportedBy { get; set; }

    [MaxLength(200)]
    public string? TransportedByOther { get; set; }

    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    [MaxLength(200)]
    public string? VehicleOther { get; set; }

    public int? MaterialId { get; set; }
    public Material? Material { get; set; }

    // Either VendorId (FK) or VendorOther (free text) must be set
    public int? VendorId { get; set; }
    public Vendor? Vendor { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    // Either ProjectId (FK) or ProjectOther (free text) must be set
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Quantity { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? PerUnitCost { get; set; }

    // Computed and stored: Quantity * PerUnitCost
    [Column(TypeName = "numeric(18,2)")]
    public decimal? MaterialCost { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Tax { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Wages { get; set; }

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
