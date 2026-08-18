using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class FuelLogListItemDto
{
    public int Id { get; set; }
    public int DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public int FuelTypeId { get; set; }
    public string FuelTypeName { get; set; } = string.Empty;
    public int? PartyNameId { get; set; }
    public string? PartyNameName { get; set; }
    public string? PartyNameOther { get; set; }
    public decimal Quantity { get; set; }
    public decimal Price { get; set; }
    public DateOnly Date { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateFuelLogRequest
{
    [Required]
    public int DriverId { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    public int FuelTypeId { get; set; }

    public int? PartyNameId { get; set; }

    [MaxLength(200)]
    public string? PartyNameOther { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class UpdateFuelLogRequest
{
    [Required]
    public int DriverId { get; set; }

    [Required]
    public int VehicleId { get; set; }

    [Required]
    public int FuelTypeId { get; set; }

    public int? PartyNameId { get; set; }

    [MaxLength(200)]
    public string? PartyNameOther { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal Quantity { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class FuelLogPagedRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? DriverName { get; set; }
    public string? VehicleName { get; set; }
    public int? DriverId { get; set; }
    public string? SortBy { get; set; } = "date";
    public bool SortDescending { get; set; } = true;
}

