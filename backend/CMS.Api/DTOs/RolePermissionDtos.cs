using System.ComponentModel.DataAnnotations;

namespace CMS.Api.DTOs;

public class RolePermissionsDto
{
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<int> PermissionIds { get; set; } = [];
}

public class SetRolePermissionsRequest
{
    [Required]
    public List<int> PermissionIds { get; set; } = [];
}
