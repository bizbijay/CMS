using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class VendorListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PanNumber { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVendorRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PanNumber { get; set; }
}

public class UpdateVendorRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PanNumber { get; set; }
}
