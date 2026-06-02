using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class UserListItemDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool IsActive { get; set; }
    public int? RoleId { get; set; }
    public string? RoleName { get; set; }
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

    [Required, MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    public bool IsActive { get; set; } = true;

    public int? RoleId { get; set; }

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

    public int? RoleId { get; set; }

    public int? VehicleId { get; set; }

    [MaxLength(100)]
    public string? Password { get; set; }
}
