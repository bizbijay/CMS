using System.ComponentModel.DataAnnotations;
using CMS.Api.Models;

namespace CMS.Api.DTOs;

public class UserListItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsActive { get; set; }
    public UserType Type { get; set; }
    public int? VehicleId { get; set; }
    public string? AssignedVehicleName { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class CreateUserRequest
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    // Strength enforced server-side by PasswordPolicy.
    [Required, MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    public bool IsActive { get; set; } = true;

    public UserType Type { get; set; } = UserType.Admin;

    public int? VehicleId { get; set; }
}

public class UpdateUserRequest
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    public bool IsActive { get; set; } = true;

    public UserType Type { get; set; } = UserType.Admin;

    public int? VehicleId { get; set; }

    // Optional. When null or empty, the existing password is kept.
    // When provided, strength is enforced server-side by PasswordPolicy.
    [MaxLength(100)]
    public string? Password { get; set; }
}
