using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CMS.Api.Models;

public enum UserType
{
    Admin,
    Driver
}

[Table("Users")]
public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    public bool IsActive { get; set; } = true;

    public UserType Type { get; set; } = UserType.Admin;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public int? VehicleId { get; set; }
    public Vehicle? AssignedVehicle { get; set; }

    public int? CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public int? UpdatedById { get; set; }
    public User? UpdatedBy { get; set; }
}
