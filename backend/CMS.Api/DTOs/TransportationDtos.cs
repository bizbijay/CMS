using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class TransportationListItemDto
{
    public int Id { get; set; }
    public int? TransportedById { get; set; }
    public string TransportedByName { get; set; } = string.Empty;
    public string? TransportedByOther { get; set; }
    public int? VehicleId { get; set; }
    public string? VehicleName { get; set; }
    public string? VehicleOther { get; set; }
    public int? MaterialId { get; set; }
    public string? MaterialName { get; set; }
    public int? VendorId { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public string? VendorOther { get; set; }
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectOther { get; set; }
    public string? Location { get; set; }
    public int? PartyNameId { get; set; }
    public string? PartyNameName { get; set; }
    public int? NoOfTip { get; set; }
    public decimal? Quantity { get; set; }
    public decimal? PerUnitCost { get; set; }
    public decimal? MaterialCost { get; set; }
    public decimal? Tax { get; set; }
    public decimal? Wages { get; set; }
    public decimal? TotalWages { get; set; }
    public DateOnly Date { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateTransportationRequest
{
    public int? TransportedById { get; set; }

    [MaxLength(200)]
    public string? TransportedByOther { get; set; }

    public int? VehicleId { get; set; }

    [MaxLength(200)]
    public string? VehicleOther { get; set; }

    public int? MaterialId { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public int? PartyNameId { get; set; }

    public int? NoOfTip { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? PerUnitCost { get; set; }

    public decimal? Tax { get; set; }

    public decimal? Wages { get; set; }

    public decimal? TotalWages { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class UpdateTransportationRequest
{
    public int? TransportedById { get; set; }

    [MaxLength(200)]
    public string? TransportedByOther { get; set; }

    public int? VehicleId { get; set; }

    [MaxLength(200)]
    public string? VehicleOther { get; set; }

    public int? MaterialId { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public int? PartyNameId { get; set; }

    public int? NoOfTip { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? PerUnitCost { get; set; }

    public decimal? Tax { get; set; }

    public decimal? Wages { get; set; }

    public decimal? TotalWages { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}
