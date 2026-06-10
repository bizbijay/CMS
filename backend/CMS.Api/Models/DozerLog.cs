using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("DozerLogs")]
public class DozerLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int DriverId { get; set; }
    public User? Driver { get; set; }

    public int? VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    [Required]
    public DateOnly OperationDate { get; set; }

    /// <summary>Total operated time stored in milliseconds.</summary>
    [Required]
    [Range(0, int.MaxValue)]
    public int OperatedTimeMs { get; set; }

    // Either ProjectId (FK) or ProjectOther (free text) must be set
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Column(TypeName = "numeric(12,2)")]
    public decimal? Wages { get; set; }

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
