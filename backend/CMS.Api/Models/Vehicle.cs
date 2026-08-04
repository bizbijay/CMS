using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

public enum VehicleType
{
    Tipper,
    Jcb,
    Nissan
}

public enum VehicleOwnership
{
    Owned,
    Partnered
}

[Table("Vehicles")]
public class Vehicle
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string NumberPlate { get; set; } = string.Empty;

    [Required]
    public VehicleType Type { get; set; }

    [Required]
    public VehicleOwnership Ownership { get; set; } = VehicleOwnership.Owned;

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
