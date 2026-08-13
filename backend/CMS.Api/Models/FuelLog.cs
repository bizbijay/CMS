using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

[Table("FuelLogs")]
public class FuelLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int DriverId { get; set; }
    public User? Driver { get; set; }

    [Required]
    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }

    [Required]
    public int FuelTypeId { get; set; }
    public Fuel? FuelType { get; set; }

    public int? PartyNameId { get; set; }
    public PartyName? PartyName { get; set; }

    [MaxLength(200)]
    public string? PartyNameOther { get; set; }

    [Required]
    public decimal Quantity { get; set; }

    [Required]
    public decimal Price { get; set; }

    [Required]
    public DateOnly Date { get; set; }

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
