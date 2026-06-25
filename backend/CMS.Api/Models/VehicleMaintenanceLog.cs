using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("VehicleMaintenanceLogs")]
public class VehicleMaintenanceLog
{
    [Key]
    public int Id { get; set; }

    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

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
