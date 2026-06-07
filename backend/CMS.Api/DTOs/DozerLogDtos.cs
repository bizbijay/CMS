using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class DozerLogListItemDto
{
    public int Id { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public int? VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public DateOnly OperationDate { get; set; }
    public int OperatedTimeMs { get; set; }
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectOther { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateDozerLogRequest
{
    [Required]
    public int DriverId { get; set; }

    public int? VehicleId { get; set; }

    [Required]
    public DateOnly OperationDate { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int OperatedTimeMs { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }
}

public class UpdateDozerLogRequest
{
    [Required]
    public int DriverId { get; set; }

    public int? VehicleId { get; set; }

    [Required]
    public DateOnly OperationDate { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int OperatedTimeMs { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }
}
