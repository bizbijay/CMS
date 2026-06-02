using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _db;

    public MaterialService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MaterialListItemDto>> GetAllAsync()
    {
        var materials = await _db.Materials
            .Include(m => m.CreatedBy)
            .Include(m => m.UpdatedBy)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
        return materials.Select(ToDto);
    }

    public async Task<MaterialListItemDto?> GetByIdAsync(int id)
    {
        var material = await _db.Materials
            .Include(m => m.CreatedBy)
            .Include(m => m.UpdatedBy)
            .FirstOrDefaultAsync(m => m.Id == id);
        return material is null ? null : ToDto(material);
    }

    public async Task<MaterialListItemDto> CreateAsync(CreateMaterialRequest request, int createdById)
    {
        var material = new Material
        {
            Name = request.Name.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.Materials.Add(material);
        await _db.SaveChangesAsync();

        await _db.Entry(material).Reference(m => m.CreatedBy).LoadAsync();

        return ToDto(material);
    }

    public async Task<(MaterialListItemDto? Material, string? Error)> UpdateAsync(int id, UpdateMaterialRequest request, int updatedById)
    {
        var material = await _db.Materials
            .Include(m => m.CreatedBy)
            .Include(m => m.UpdatedBy)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material is null) return (null, null);

        material.Name = request.Name.Trim();
        material.UpdatedById = updatedById;
        material.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(material).Reference(m => m.UpdatedBy).LoadAsync();

        return (ToDto(material), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var material = await _db.Materials.FindAsync(id);
        if (material is null) return false;

        _db.Materials.Remove(material);
        await _db.SaveChangesAsync();
        return true;
    }

    private static MaterialListItemDto ToDto(Material m) => new()
    {
        Id = m.Id,
        Name = m.Name,
        CreatedBy = m.CreatedBy?.Username,
        UpdatedBy = m.UpdatedBy?.Username,
        CreatedAt = m.CreatedAt,
        UpdatedAt = m.UpdatedAt
    };
}
