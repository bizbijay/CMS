using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class RoleService : IRoleService
{
    private readonly AppDbContext _db;
    public RoleService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<RoleListItemDto>> GetAllAsync()
    {
        var roles = await _db.Roles
            .Include(r => r.CreatedBy).Include(r => r.UpdatedBy)
            .OrderByDescending(r => r.CreatedAt).ToListAsync();
        return roles.Select(ToDto);
    }

    public async Task<RoleListItemDto?> GetByIdAsync(int id)
    {
        var role = await _db.Roles
            .Include(r => r.CreatedBy).Include(r => r.UpdatedBy)
            .FirstOrDefaultAsync(r => r.Id == id);
        return role is null ? null : ToDto(role);
    }

    public async Task<RoleListItemDto> CreateAsync(CreateRoleRequest request, int createdById)
    {
        var role = new Role { Name = request.Name.Trim(), CreatedById = createdById, CreatedAt = DateTime.UtcNow };
        _db.Roles.Add(role);
        await _db.SaveChangesAsync();
        await _db.Entry(role).Reference(r => r.CreatedBy).LoadAsync();
        return ToDto(role);
    }

    public async Task<(RoleListItemDto? Role, string? Error)> UpdateAsync(int id, UpdateRoleRequest request, int updatedById)
    {
        var role = await _db.Roles.Include(r => r.CreatedBy).Include(r => r.UpdatedBy)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) return (null, null);
        role.Name = request.Name.Trim();
        role.UpdatedById = updatedById;
        role.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(role).Reference(r => r.UpdatedBy).LoadAsync();
        return (ToDto(role), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var role = await _db.Roles.FindAsync(id);
        if (role is null) return false;

        role.IsDeleted = true;
        role.DeletedById = deletedById;
        role.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static RoleListItemDto ToDto(Role r) => new()
    {
        Id = r.Id, Name = r.Name,
        CreatedBy = r.CreatedBy?.Username, UpdatedBy = r.UpdatedBy?.Username,
        CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt
    };
}
