using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class MaintenancePartService : IMaintenancePartService
{
    private readonly AppDbContext _db;

    public MaintenancePartService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MaintenancePartListItemDto>> GetAllAsync()
    {
        var parts = await _db.MaintenanceParts
            .OrderBy(p => p.Name)
            .ToListAsync();
        return parts.Select(ToDto);
    }

    public async Task<MaintenancePartListItemDto> CreateAsync(CreateMaintenancePartRequest request, int createdById)
    {
        var part = new MaintenancePart
        {
            Name = request.Name.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.MaintenanceParts.Add(part);
        await _db.SaveChangesAsync();
        return ToDto(part);
    }

    public async Task<(MaintenancePartListItemDto? Part, string? Error)> UpdateAsync(int id, UpdateMaintenancePartRequest request, int updatedById)
    {
        var part = await _db.MaintenanceParts.FindAsync(id);
        if (part is null) return (null, null);

        part.Name = request.Name.Trim();
        part.UpdatedById = updatedById;
        part.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (ToDto(part), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var part = await _db.MaintenanceParts.FindAsync(id);
        if (part is null) return false;

        part.IsDeleted = true;
        part.DeletedById = deletedById;
        part.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static MaintenancePartListItemDto ToDto(MaintenancePart p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
