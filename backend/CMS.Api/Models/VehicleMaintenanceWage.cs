using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("VehicleMaintenanceWages")]
public class VehicleMaintenanceWage
{
    [Key]
    public int Id { get; set; }

    public int MaintenanceLogId { get; set; }
    public VehicleMaintenanceLog? MaintenanceLog { get; set; }

    public int NumberOfWorkers { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal Rate { get; set; }

    [Required, Column(TypeName = "numeric(18,2)")]
    public decimal TotalAmount { get; set; }

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
