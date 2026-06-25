using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

// ── Maintenance Log ──────────────────────────────────────────────────────────

public class VehicleMaintenanceLogListItemDto
{
    public int Id { get; set; }
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string VehicleNumberPlate { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? Remarks { get; set; }
    public decimal PartsCostTotal { get; set; }
    public decimal WagesCostTotal { get; set; }
    public decimal TotalCost { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVehicleMaintenanceLogRequest
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateVehicleMaintenanceLogRequest
{
    [Required]
    public int VehicleId { get; set; }

    [Required]
    public DateOnly Date { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

// ── Maintenance Part ─────────────────────────────────────────────────────────

public class VehicleMaintenancePartListItemDto
{
    public int Id { get; set; }
    public int MaintenanceLogId { get; set; }
    public int MaintenancePartId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public decimal? Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public decimal? TotalCost { get; set; }
    public string? Remarks { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVehicleMaintenancePartRequest
{
    [Required]
    public int MaintenanceLogId { get; set; }

    [Required]
    public int MaintenancePartId { get; set; }

    public decimal? Quantity { get; set; }
    public decimal? UnitCost { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateVehicleMaintenancePartRequest
{
    [Required]
    public int MaintenancePartId { get; set; }

    public decimal? Quantity { get; set; }
    public decimal? UnitCost { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

// ── Maintenance Wage ─────────────────────────────────────────────────────────

public class VehicleMaintenanceWageListItemDto
{
    public int Id { get; set; }
    public int MaintenanceLogId { get; set; }
    public int NumberOfWorkers { get; set; }
    public decimal Rate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Remarks { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVehicleMaintenanceWageRequest
{
    [Required]
    public int MaintenanceLogId { get; set; }

    [Range(1, int.MaxValue)]
    public int NumberOfWorkers { get; set; }

    [Required]
    public decimal Rate { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}

public class UpdateVehicleMaintenanceWageRequest
{
    [Range(1, int.MaxValue)]
    public int NumberOfWorkers { get; set; }

    [Required]
    public decimal Rate { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }
}
