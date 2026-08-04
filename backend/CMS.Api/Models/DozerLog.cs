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

    /// <summary>Total operated time stored in milliseconds (nullable - for legacy support).</summary>
    [Range(0, int.MaxValue)]
    public int? OperatedTimeMs { get; set; }

    /// <summary>Start meter reading (e.g., 1234.5)</summary>
    [Required]
    [Column(TypeName = "numeric(10,2)")]
    [Range(0, double.MaxValue)]
    public decimal StartMeter { get; set; }

    /// <summary>End meter reading (e.g., 1263.8)</summary>
    [Required]
    [Column(TypeName = "numeric(10,2)")]
    [Range(0, double.MaxValue)]
    public decimal EndMeter { get; set; }

    /// <summary>Total meter run calculated as EndMeter - StartMeter</summary>
    [Column(TypeName = "numeric(10,2)")]
    public decimal TotalMeterRun { get; set; }

    // Either ProjectId (FK) or ProjectOther (free text) must be set
    public int? ProjectId { get; set; }
    public Project? Project { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Column(TypeName = "numeric(12,2)")]
    public decimal? Wages { get; set; }

    public int? PartyNameId { get; set; }
    public PartyName? PartyName { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(20)]
    public string? PaymentType { get; set; }

    [Column(TypeName = "numeric(12,2)")]
    [Range(0, double.MaxValue)]
    public decimal? CashAmount { get; set; }

    [MaxLength(200)]
    public string? WorkOrderBy { get; set; }

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
