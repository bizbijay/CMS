using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class TransportationListItemDto
{
    public int Id { get; set; }
    public int TransportedById { get; set; }
    public string TransportedByName { get; set; } = string.Empty;
    public int? VendorId { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public string? VendorOther { get; set; }
    public int? ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? ProjectOther { get; set; }
    public DateOnly Date { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateTransportationRequest
{
    [Required]
    public int TransportedById { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}

public class UpdateTransportationRequest
{
    [Required]
    public int TransportedById { get; set; }

    public int? VendorId { get; set; }

    [MaxLength(200)]
    public string? VendorOther { get; set; }

    public int? ProjectId { get; set; }

    [MaxLength(200)]
    public string? ProjectOther { get; set; }

    [Required]
    public DateOnly Date { get; set; }
}
