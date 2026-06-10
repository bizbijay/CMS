using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class FuelService : IFuelService
{
    private readonly AppDbContext _db;
    public FuelService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<FuelListItemDto>> GetAllAsync()
    {
        var fuels = await _db.Fuels
            .Include(f => f.CreatedBy).Include(f => f.UpdatedBy)
            .OrderByDescending(f => f.CreatedAt).ToListAsync();
        return fuels.Select(ToDto);
    }

    public async Task<FuelListItemDto?> GetByIdAsync(int id)
    {
        var fuel = await _db.Fuels
            .Include(f => f.CreatedBy).Include(f => f.UpdatedBy)
            .FirstOrDefaultAsync(f => f.Id == id);
        return fuel is null ? null : ToDto(fuel);
    }

    public async Task<FuelListItemDto> CreateAsync(CreateFuelRequest request, int createdById)
    {
        var fuel = new Fuel
        {
            Name = request.Name.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.Fuels.Add(fuel);
        await _db.SaveChangesAsync();
        await _db.Entry(fuel).Reference(f => f.CreatedBy).LoadAsync();
        return ToDto(fuel);
    }

    public async Task<(FuelListItemDto? Fuel, string? Error)> UpdateAsync(int id, UpdateFuelRequest request, int updatedById)
    {
        var fuel = await _db.Fuels
            .Include(f => f.CreatedBy).Include(f => f.UpdatedBy)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (fuel is null) return (null, null);

        fuel.Name = request.Name.Trim();
        fuel.UpdatedById = updatedById;
        fuel.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(fuel).Reference(f => f.UpdatedBy).LoadAsync();
        return (ToDto(fuel), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var fuel = await _db.Fuels.FindAsync(id);
        if (fuel is null) return false;

        fuel.IsDeleted = true;
        fuel.DeletedById = deletedById;
        fuel.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static FuelListItemDto ToDto(Fuel f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        CreatedBy = f.CreatedBy?.Username,
        UpdatedBy = f.UpdatedBy?.Username,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };
}
