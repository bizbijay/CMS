using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class RolePermissionService : IRolePermissionService
{
    private readonly AppDbContext _db;
    public RolePermissionService(AppDbContext db) => _db = db;

    public async Task<RolePermissionsDto?> GetByRoleIdAsync(int roleId)
    {
        var role = await _db.Roles.FindAsync(roleId);
        if (role is null) return null;

        var permissionIds = await _db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        return new RolePermissionsDto { RoleId = role.Id, RoleName = role.Name, PermissionIds = permissionIds };
    }

    public async Task<(RolePermissionsDto? Result, string? Error)> SetAsync(int roleId, SetRolePermissionsRequest request)
    {
        var role = await _db.Roles.FindAsync(roleId);
        if (role is null) return (null, null);

        var invalidIds = request.PermissionIds.Distinct()
            .Except(await _db.Permissions.Select(p => p.Id).ToListAsync())
            .ToList();
        if (invalidIds.Count > 0)
            return (null, $"Unknown permission IDs: {string.Join(", ", invalidIds)}.");

        var existing = await _db.RolePermissions.Where(rp => rp.RoleId == roleId).ToListAsync();
        _db.RolePermissions.RemoveRange(existing);

        foreach (var permId in request.PermissionIds.Distinct())
            _db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permId });

        await _db.SaveChangesAsync();

        var permissionIds = await _db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync();

        return (new RolePermissionsDto { RoleId = role.Id, RoleName = role.Name, PermissionIds = permissionIds }, null);
    }
}
