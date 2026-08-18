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
    public int? OperatedTimeMs { get; set; }
    public decimal StartMeter { get; set; }
    public decimal EndMeter { get; set; }
    public decimal TotalMeterRun { get; set; }
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectOther { get; set; }
    public decimal? Wages { get; set; }
    public int? PartyNameId { get; set; }
    public string? PartyNameName { get; set; }
    public string? Location { get; set; }
    public string? PaymentType { get; set; }
    public decimal? CashAmount { get; set; }
    public string? WorkOrderBy { get; set; }
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
    [Range(0, double.MaxValue)]
    public decimal StartMeter { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal EndMeter { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Wages { get; set; }

    public int? PartyNameId { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(20)]
    public string? PaymentType { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? CashAmount { get; set; }

    [MaxLength(200)]
    public string? WorkOrderBy { get; set; }
}

public class UpdateDozerLogRequest
{
    [Required]
    public int DriverId { get; set; }

    public int? VehicleId { get; set; }

    [Required]
    public DateOnly OperationDate { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal StartMeter { get; set; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal EndMeter { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Wages { get; set; }

    public int? PartyNameId { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(20)]
    public string? PaymentType { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? CashAmount { get; set; }

    [MaxLength(200)]
    public string? WorkOrderBy { get; set; }
}

public class DozerLogPagedRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int? DriverId { get; set; }
    public int? VehicleId { get; set; }
    public string? DriverName { get; set; }
    public string? VehicleName { get; set; }
    public string? SortBy { get; set; } = "operationDate";
    public bool SortDescending { get; set; } = true;
}

