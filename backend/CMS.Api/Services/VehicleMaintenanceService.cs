using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

// ── Log Service ──────────────────────────────────────────────────────────────

public class VehicleMaintenanceLogService : IVehicleMaintenanceLogService
{
    private readonly AppDbContext _db;
    public VehicleMaintenanceLogService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<VehicleMaintenanceLogListItemDto>> GetByVehicleAsync(int vehicleId)
    {
        var logs = await _db.VehicleMaintenanceLogs
            .Where(l => l.VehicleId == vehicleId)
            .Include(l => l.Vehicle)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();

        var logIds = logs.Select(l => l.Id).ToList();

        var partTotals = await _db.VehicleMaintenanceParts
            .Where(p => logIds.Contains(p.MaintenanceLogId))
            .GroupBy(p => p.MaintenanceLogId)
            .Select(g => new { LogId = g.Key, Total = g.Sum(p => p.TotalCost ?? 0m) })
            .ToListAsync();

        var wageTotals = await _db.VehicleMaintenanceWages
            .Where(w => logIds.Contains(w.MaintenanceLogId))
            .GroupBy(w => w.MaintenanceLogId)
            .Select(g => new { LogId = g.Key, Total = g.Sum(w => w.TotalAmount) })
            .ToListAsync();

        return logs.Select(l =>
        {
            var parts = partTotals.FirstOrDefault(p => p.LogId == l.Id)?.Total ?? 0m;
            var wages = wageTotals.FirstOrDefault(w => w.LogId == l.Id)?.Total ?? 0m;
            return ToDto(l, parts, wages);
        });
    }

    public async Task<VehicleMaintenanceLogListItemDto?> GetByIdAsync(int id)
    {
        var log = await _db.VehicleMaintenanceLogs
            .Include(l => l.Vehicle)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (log is null) return null;

        var parts = await _db.VehicleMaintenanceParts
            .Where(p => p.MaintenanceLogId == id)
            .SumAsync(p => p.TotalCost ?? 0m);
        var wages = await _db.VehicleMaintenanceWages
            .Where(w => w.MaintenanceLogId == id)
            .SumAsync(w => w.TotalAmount);
        return ToDto(log, parts, wages);
    }

    public async Task<(VehicleMaintenanceLogListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenanceLogRequest request, int createdById)
    {
        var vehicle = await _db.Vehicles.FindAsync(request.VehicleId);
        if (vehicle is null) return (null, "Vehicle not found.");

        var log = new VehicleMaintenanceLog
        {
            VehicleId = request.VehicleId,
            Date = request.Date,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.VehicleMaintenanceLogs.Add(log);
        await _db.SaveChangesAsync();
        await _db.Entry(log).Reference(l => l.Vehicle).LoadAsync();
        await _db.Entry(log).Reference(l => l.CreatedBy).LoadAsync();
        return (ToDto(log, 0m, 0m), null);
    }

    public async Task<(VehicleMaintenanceLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenanceLogRequest request, int updatedById)
    {
        var log = await _db.VehicleMaintenanceLogs
            .Include(l => l.Vehicle)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (log is null) return (null, null);

        var vehicle = await _db.Vehicles.FindAsync(request.VehicleId);
        if (vehicle is null) return (null, "Vehicle not found.");

        log.VehicleId = request.VehicleId;
        log.Date = request.Date;
        log.Remarks = request.Remarks?.Trim();
        log.UpdatedById = updatedById;
        log.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(log).Reference(l => l.Vehicle).LoadAsync();
        await _db.Entry(log).Reference(l => l.UpdatedBy).LoadAsync();

        var parts = await _db.VehicleMaintenanceParts.Where(p => p.MaintenanceLogId == id).SumAsync(p => p.TotalCost ?? 0m);
        var wages = await _db.VehicleMaintenanceWages.Where(w => w.MaintenanceLogId == id).SumAsync(w => w.TotalAmount);
        return (ToDto(log, parts, wages), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var log = await _db.VehicleMaintenanceLogs.FindAsync(id);
        if (log is null) return false;
        log.IsDeleted = true;
        log.DeletedById = deletedById;
        log.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static VehicleMaintenanceLogListItemDto ToDto(VehicleMaintenanceLog l, decimal parts, decimal wages) => new()
    {
        Id = l.Id,
        VehicleId = l.VehicleId,
        VehicleName = l.Vehicle?.Name ?? string.Empty,
        VehicleNumberPlate = l.Vehicle?.NumberPlate ?? string.Empty,
        Date = l.Date,
        Remarks = l.Remarks,
        PartsCostTotal = parts,
        WagesCostTotal = wages,
        TotalCost = parts + wages,
        CreatedBy = l.CreatedBy?.Username,
        UpdatedBy = l.UpdatedBy?.Username,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };
}

// ── Part Service ─────────────────────────────────────────────────────────────

public class VehicleMaintenancePartService : IVehicleMaintenancePartService
{
    private readonly AppDbContext _db;
    public VehicleMaintenancePartService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<VehicleMaintenancePartListItemDto>> GetByLogAsync(int logId)
    {
        var items = await _db.VehicleMaintenanceParts
            .Where(p => p.MaintenanceLogId == logId)
            .Include(p => p.Part)
            .Include(p => p.CreatedBy)
            .Include(p => p.UpdatedBy)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<(VehicleMaintenancePartListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenancePartRequest request, int createdById)
    {
        var logExists = await _db.VehicleMaintenanceLogs.AnyAsync(l => l.Id == request.MaintenanceLogId);
        if (!logExists) return (null, "Maintenance log not found.");

        var masterPart = await _db.MaintenanceParts.FindAsync(request.MaintenancePartId);
        if (masterPart is null) return (null, "Part not found.");

        var totalCost = request.Quantity.HasValue && request.UnitCost.HasValue
            ? request.Quantity.Value * request.UnitCost.Value
            : (decimal?)null;

        var part = new VehicleMaintenancePart
        {
            MaintenanceLogId = request.MaintenanceLogId,
            MaintenancePartId = request.MaintenancePartId,
            Quantity = request.Quantity,
            UnitCost = request.UnitCost,
            TotalCost = totalCost,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.VehicleMaintenanceParts.Add(part);
        await _db.SaveChangesAsync();
        await _db.Entry(part).Reference(p => p.Part).LoadAsync();
        await _db.Entry(part).Reference(p => p.CreatedBy).LoadAsync();
        return (ToDto(part), null);
    }

    public async Task<(VehicleMaintenancePartListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenancePartRequest request, int updatedById)
    {
        var part = await _db.VehicleMaintenanceParts
            .Include(p => p.Part)
            .Include(p => p.CreatedBy)
            .Include(p => p.UpdatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (part is null) return (null, null);

        var masterPart = await _db.MaintenanceParts.FindAsync(request.MaintenancePartId);
        if (masterPart is null) return (null, "Part not found.");

        var totalCost = request.Quantity.HasValue && request.UnitCost.HasValue
            ? request.Quantity.Value * request.UnitCost.Value
            : (decimal?)null;

        part.MaintenancePartId = request.MaintenancePartId;
        part.Quantity = request.Quantity;
        part.UnitCost = request.UnitCost;
        part.TotalCost = totalCost;
        part.Remarks = request.Remarks?.Trim();
        part.UpdatedById = updatedById;
        part.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(part).Reference(p => p.Part).LoadAsync();
        await _db.Entry(part).Reference(p => p.UpdatedBy).LoadAsync();
        return (ToDto(part), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var part = await _db.VehicleMaintenanceParts.FindAsync(id);
        if (part is null) return false;
        part.IsDeleted = true;
        part.DeletedById = deletedById;
        part.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static VehicleMaintenancePartListItemDto ToDto(VehicleMaintenancePart p) => new()
    {
        Id = p.Id,
        MaintenanceLogId = p.MaintenanceLogId,
        MaintenancePartId = p.MaintenancePartId,
        PartName = p.Part?.Name ?? string.Empty,
        Quantity = p.Quantity,
        UnitCost = p.UnitCost,
        TotalCost = p.TotalCost,
        Remarks = p.Remarks,
        CreatedBy = p.CreatedBy?.Username,
        UpdatedBy = p.UpdatedBy?.Username,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}

// ── Wage Service ─────────────────────────────────────────────────────────────

public class VehicleMaintenanceWageService : IVehicleMaintenanceWageService
{
    private readonly AppDbContext _db;
    public VehicleMaintenanceWageService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<VehicleMaintenanceWageListItemDto>> GetByLogAsync(int logId)
    {
        var items = await _db.VehicleMaintenanceWages
            .Where(w => w.MaintenanceLogId == logId)
            .Include(w => w.CreatedBy)
            .Include(w => w.UpdatedBy)
            .OrderBy(w => w.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<(VehicleMaintenanceWageListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenanceWageRequest request, int createdById)
    {
        var logExists = await _db.VehicleMaintenanceLogs.AnyAsync(l => l.Id == request.MaintenanceLogId);
        if (!logExists) return (null, "Maintenance log not found.");

        var wage = new VehicleMaintenanceWage
        {
            MaintenanceLogId = request.MaintenanceLogId,
            NumberOfWorkers = request.NumberOfWorkers,
            Rate = request.Rate,
            TotalAmount = request.NumberOfWorkers * request.Rate,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.VehicleMaintenanceWages.Add(wage);
        await _db.SaveChangesAsync();
        await _db.Entry(wage).Reference(w => w.CreatedBy).LoadAsync();
        return (ToDto(wage), null);
    }

    public async Task<(VehicleMaintenanceWageListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenanceWageRequest request, int updatedById)
    {
        var wage = await _db.VehicleMaintenanceWages
            .Include(w => w.CreatedBy)
            .Include(w => w.UpdatedBy)
            .FirstOrDefaultAsync(w => w.Id == id);
        if (wage is null) return (null, null);

        wage.NumberOfWorkers = request.NumberOfWorkers;
        wage.Rate = request.Rate;
        wage.TotalAmount = request.NumberOfWorkers * request.Rate;
        wage.Remarks = request.Remarks?.Trim();
        wage.UpdatedById = updatedById;
        wage.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(wage).Reference(w => w.UpdatedBy).LoadAsync();
        return (ToDto(wage), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var wage = await _db.VehicleMaintenanceWages.FindAsync(id);
        if (wage is null) return false;
        wage.IsDeleted = true;
        wage.DeletedById = deletedById;
        wage.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static VehicleMaintenanceWageListItemDto ToDto(VehicleMaintenanceWage w) => new()
    {
        Id = w.Id,
        MaintenanceLogId = w.MaintenanceLogId,
        NumberOfWorkers = w.NumberOfWorkers,
        Rate = w.Rate,
        TotalAmount = w.TotalAmount,
        Remarks = w.Remarks,
        CreatedBy = w.CreatedBy?.Username,
        UpdatedBy = w.UpdatedBy?.Username,
        CreatedAt = w.CreatedAt,
        UpdatedAt = w.UpdatedAt
    };
}
