using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class FuelLogService : IFuelLogService
{
    private readonly AppDbContext _db;
    public FuelLogService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<FuelLogListItemDto>> GetAllAsync()
    {
        var logs = await _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();
        return logs.Select(ToDto);
    }

    public async Task<FuelLogListItemDto?> GetByIdAsync(int id)
    {
        var log = await _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        return log is null ? null : ToDto(log);
    }

    public async Task<(FuelLogListItemDto? Item, string? Error)> CreateAsync(CreateFuelLogRequest request, int createdById)
    {
        var error = await Validate(request.DriverId, request.VehicleId, request.FuelTypeId);
        if (error is not null) return (null, error);

        var log = new FuelLog
        {
            DriverId = request.DriverId,
            VehicleId = request.VehicleId,
            FuelTypeId = request.FuelTypeId,
            Quantity = request.Quantity,
            Price = request.Price,
            Date = request.Date,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.FuelLogs.Add(log);
        await _db.SaveChangesAsync();

        await _db.Entry(log).Reference(l => l.Driver).LoadAsync();
        await _db.Entry(log).Reference(l => l.Vehicle).LoadAsync();
        await _db.Entry(log).Reference(l => l.FuelType).LoadAsync();
        await _db.Entry(log).Reference(l => l.CreatedBy).LoadAsync();

        return (ToDto(log), null);
    }

    public async Task<(FuelLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateFuelLogRequest request, int updatedById)
    {
        var log = await _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (log is null) return (null, null);

        var error = await Validate(request.DriverId, request.VehicleId, request.FuelTypeId);
        if (error is not null) return (null, error);

        log.DriverId = request.DriverId;
        log.VehicleId = request.VehicleId;
        log.FuelTypeId = request.FuelTypeId;
        log.Quantity = request.Quantity;
        log.Price = request.Price;
        log.Date = request.Date;
        log.UpdatedById = updatedById;
        log.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(log).Reference(l => l.Driver).LoadAsync();
        await _db.Entry(log).Reference(l => l.Vehicle).LoadAsync();
        await _db.Entry(log).Reference(l => l.FuelType).LoadAsync();
        await _db.Entry(log).Reference(l => l.UpdatedBy).LoadAsync();

        return (ToDto(log), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var log = await _db.FuelLogs.FindAsync(id);
        if (log is null) return false;
        _db.FuelLogs.Remove(log);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> Validate(int driverId, int vehicleId, int fuelTypeId)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == driverId))
            return "Selected driver does not exist.";
        if (!await _db.Vehicles.AnyAsync(v => v.Id == vehicleId))
            return "Selected vehicle does not exist.";
        if (!await _db.Fuels.AnyAsync(f => f.Id == fuelTypeId))
            return "Selected fuel type does not exist.";
        return null;
    }

    private static string UserDisplayName(User? u) =>
        u is null ? "—" :
        string.IsNullOrWhiteSpace($"{u.FirstName} {u.LastName}".Trim())
            ? u.Username
            : $"{u.FirstName} {u.LastName}".Trim();

    private static FuelLogListItemDto ToDto(FuelLog l) => new()
    {
        Id = l.Id,
        DriverId = l.DriverId,
        DriverName = UserDisplayName(l.Driver),
        VehicleId = l.VehicleId,
        VehicleName = l.Vehicle is null ? string.Empty : $"{l.Vehicle.Name} ({l.Vehicle.NumberPlate})",
        FuelTypeId = l.FuelTypeId,
        FuelTypeName = l.FuelType?.Name ?? string.Empty,
        Quantity = l.Quantity,
        Price = l.Price,
        Date = l.Date,
        CreatedBy = l.CreatedBy?.Username,
        UpdatedBy = l.UpdatedBy?.Username,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };
}
