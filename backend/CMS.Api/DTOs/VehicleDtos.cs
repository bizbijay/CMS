using System.ComponentModel.DataAnnotations;
using CMS.Api.Models;

namespace CMS.Api.DTOs;

public class VehicleListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NumberPlate { get; set; } = string.Empty;
    public VehicleType Type { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVehicleRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string NumberPlate { get; set; } = string.Empty;

    [Required]
    public VehicleType Type { get; set; }
}

public class UpdateVehicleRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string NumberPlate { get; set; } = string.Empty;

    [Required]
    public VehicleType Type { get; set; }
}
