using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class VehicleService : IVehicleService
{
    private readonly AppDbContext _db;

    public VehicleService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<VehicleListItemDto>> GetAllAsync()
    {
        var vehicles = await _db.Vehicles
            .Include(v => v.CreatedBy)
            .Include(v => v.UpdatedBy)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync();
        return vehicles.Select(ToDto);
    }

    public async Task<VehicleListItemDto?> GetByIdAsync(int id)
    {
        var vehicle = await _db.Vehicles
            .Include(v => v.CreatedBy)
            .Include(v => v.UpdatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);
        return vehicle is null ? null : ToDto(vehicle);
    }

    public async Task<(VehicleListItemDto? Vehicle, string? Error)> CreateAsync(CreateVehicleRequest request, int createdById)
    {
        var plate = request.NumberPlate.Trim().ToUpperInvariant();

        var exists = await _db.Vehicles.AnyAsync(v => v.NumberPlate == plate);
        if (exists)
            return (null, "A vehicle with that number plate already exists.");

        var vehicle = new Vehicle
        {
            Name = request.Name.Trim(),
            NumberPlate = plate,
            Type = request.Type,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync();

        await _db.Entry(vehicle).Reference(v => v.CreatedBy).LoadAsync();

        return (ToDto(vehicle), null);
    }

    public async Task<(VehicleListItemDto? Vehicle, string? Error)> UpdateAsync(int id, UpdateVehicleRequest request, int updatedById)
    {
        var vehicle = await _db.Vehicles
            .Include(v => v.CreatedBy)
            .Include(v => v.UpdatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehicle is null) return (null, null);

        var plate = request.NumberPlate.Trim().ToUpperInvariant();

        var conflict = await _db.Vehicles.AnyAsync(v => v.Id != id && v.NumberPlate == plate);
        if (conflict)
            return (null, "Another vehicle already has that number plate.");

        vehicle.Name = request.Name.Trim();
        vehicle.NumberPlate = plate;
        vehicle.Type = request.Type;
        vehicle.UpdatedById = updatedById;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(vehicle).Reference(v => v.UpdatedBy).LoadAsync();

        return (ToDto(vehicle), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var vehicle = await _db.Vehicles.FindAsync(id);
        if (vehicle is null) return false;

        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync();
        return true;
    }

    private static VehicleListItemDto ToDto(Vehicle v) => new()
    {
        Id = v.Id,
        Name = v.Name,
        NumberPlate = v.NumberPlate,
        Type = v.Type,
        CreatedBy = v.CreatedBy?.Username,
        UpdatedBy = v.UpdatedBy?.Username,
        CreatedAt = v.CreatedAt
    };
}
