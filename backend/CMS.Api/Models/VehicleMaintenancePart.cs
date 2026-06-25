using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("VehicleMaintenanceParts")]
public class VehicleMaintenancePart
{
    [Key]
    public int Id { get; set; }

    public int MaintenanceLogId { get; set; }
    public VehicleMaintenanceLog? MaintenanceLog { get; set; }

    public int MaintenancePartId { get; set; }
    public MaintenancePart? Part { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? Quantity { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? UnitCost { get; set; }

    [Column(TypeName = "numeric(18,2)")]
    public decimal? TotalCost { get; set; }

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
