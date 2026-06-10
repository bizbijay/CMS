using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class PermissionService : IPermissionService
{
    private readonly AppDbContext _db;
    public PermissionService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<PermissionListItemDto>> GetAllAsync()
    {
        var items = await _db.Permissions
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .OrderBy(p => p.Name).ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<PermissionListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.Permissions
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<PermissionListItemDto> CreateAsync(CreatePermissionRequest request, int createdById)
    {
        var item = new Permission
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.Permissions.Add(item);
        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(p => p.CreatedBy).LoadAsync();
        return ToDto(item);
    }

    public async Task<(PermissionListItemDto? Permission, string? Error)> UpdateAsync(int id, UpdatePermissionRequest request, int updatedById)
    {
        var item = await _db.Permissions
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (item is null) return (null, null);

        item.Name = request.Name.Trim();
        item.Description = request.Description?.Trim();
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(p => p.UpdatedBy).LoadAsync();
        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.Permissions.FindAsync(id);
        if (item is null) return false;

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static PermissionListItemDto ToDto(Permission p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        CreatedBy = p.CreatedBy?.Username,
        UpdatedBy = p.UpdatedBy?.Username,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
