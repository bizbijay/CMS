using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IRolePermissionService
{
    Task<RolePermissionsDto?> GetByRoleIdAsync(int roleId);
    Task<(RolePermissionsDto? Result, string? Error)> SetAsync(int roleId, SetRolePermissionsRequest request);
}
