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
            .Include(l => l.PartyName)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .OrderByDescending(l => l.Date)
            .ThenByDescending(l => l.CreatedAt)
            .ToListAsync();
        return logs.Select(ToDto);
    }

    public async Task<PagedResultDto<FuelLogListItemDto>> GetPagedAsync(FuelLogPagedRequest request)
    {
        var query = _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.PartyName)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .AsQueryable();

        if (request.DriverId.HasValue && request.DriverId.Value > 0)
        {
            query = query.Where(l => l.DriverId == request.DriverId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.DriverName))
        {
            var driverNameTrimmed = request.DriverName.Trim();
            query = query.Where(l => l.Driver != null &&
                (l.Driver.Username == driverNameTrimmed ||
                 (l.Driver.FirstName + " " + l.Driver.LastName).Trim() == driverNameTrimmed ||
                 l.Driver.FirstName == driverNameTrimmed));
        }

        if (!string.IsNullOrWhiteSpace(request.VehicleName))
        {
            var vehicleNameTrimmed = request.VehicleName.Trim();
            query = query.Where(l => l.Vehicle != null && l.Vehicle.Name == vehicleNameTrimmed);
        }

        var totalCount = await query.CountAsync();

        var desc = request.SortDescending;
        query = (request.SortBy?.ToLowerInvariant()) switch
        {
            "drivername" or "driver" => desc
                ? query.OrderByDescending(l => l.Driver != null ? (l.Driver.FirstName + " " + l.Driver.LastName).Trim() : "").ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.Driver != null ? (l.Driver.FirstName + " " + l.Driver.LastName).Trim() : "").ThenBy(l => l.Date),
            "vehiclename" or "vehicle" => desc
                ? query.OrderByDescending(l => l.Vehicle != null ? l.Vehicle.Name : "").ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.Vehicle != null ? l.Vehicle.Name : "").ThenBy(l => l.Date),
            "fueltypename" or "fueltype" => desc
                ? query.OrderByDescending(l => l.FuelType != null ? l.FuelType.Name : "").ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.FuelType != null ? l.FuelType.Name : "").ThenBy(l => l.Date),
            "partyname" or "party" => desc
                ? query.OrderByDescending(l => l.PartyName != null ? l.PartyName.Name : (l.PartyNameOther ?? "")).ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.PartyName != null ? l.PartyName.Name : (l.PartyNameOther ?? "")).ThenBy(l => l.Date),
            "quantity" => desc
                ? query.OrderByDescending(l => l.Quantity).ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.Quantity).ThenBy(l => l.Date),
            "price" => desc
                ? query.OrderByDescending(l => l.Price).ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.Price).ThenBy(l => l.Date),
            "total" => desc
                ? query.OrderByDescending(l => l.Quantity * l.Price).ThenByDescending(l => l.Date)
                : query.OrderBy(l => l.Quantity * l.Price).ThenBy(l => l.Date),
            _ => desc
                ? query.OrderByDescending(l => l.Date).ThenByDescending(l => l.CreatedAt)
                : query.OrderBy(l => l.Date).ThenBy(l => l.CreatedAt)
        };

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Max(1, request.PageSize);

        var logs = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<FuelLogListItemDto>
        {
            Items = logs.Select(ToDto),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }


    public async Task<IEnumerable<FuelLogListItemDto>> GetReportAsync(
        string? fromDate,
        string? toDate,
        string? driverName,
        string? vehicleName,
        string? fuelTypeName,
        string? partyName)
    {
        var query = _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.PartyName)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(fromDate) && DateOnly.TryParse(fromDate, out var from))
        {
            query = query.Where(l => l.Date >= from);
        }

        if (!string.IsNullOrWhiteSpace(toDate) && DateOnly.TryParse(toDate, out var to))
        {
            query = query.Where(l => l.Date <= to);
        }

        if (!string.IsNullOrWhiteSpace(driverName))
        {
            var driverNameTrimmed = driverName.Trim();
            query = query.Where(l => l.Driver != null &&
                (l.Driver.Username == driverNameTrimmed ||
                 (l.Driver.FirstName + " " + l.Driver.LastName).Trim() == driverNameTrimmed ||
                 l.Driver.FirstName == driverNameTrimmed));
        }

        if (!string.IsNullOrWhiteSpace(vehicleName))
        {
            query = query.Where(l => l.Vehicle != null && l.Vehicle.Name == vehicleName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(fuelTypeName))
        {
            query = query.Where(l => l.FuelType != null && l.FuelType.Name == fuelTypeName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(partyName))
        {
            var partyTrimmed = partyName.Trim();
            query = query.Where(l =>
                (l.PartyName != null && l.PartyName.Name == partyTrimmed) ||
                (l.PartyNameOther != null && l.PartyNameOther == partyTrimmed));
        }

        var logs = await query
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
            .Include(l => l.PartyName)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);
        return log is null ? null : ToDto(log);
    }

    public async Task<(FuelLogListItemDto? Item, string? Error)> CreateAsync(CreateFuelLogRequest request, int createdById)
    {
        var error = await Validate(request.DriverId, request.VehicleId, request.FuelTypeId, request.PartyNameId, request.PartyNameOther);
        if (error is not null) return (null, error);

        var log = new FuelLog
        {
            DriverId = request.DriverId,
            VehicleId = request.VehicleId,
            FuelTypeId = request.FuelTypeId,
            PartyNameId = request.PartyNameId,
            PartyNameOther = string.IsNullOrWhiteSpace(request.PartyNameOther) ? null : request.PartyNameOther.Trim(),
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
        if (log.PartyNameId.HasValue) await _db.Entry(log).Reference(l => l.PartyName).LoadAsync();
        await _db.Entry(log).Reference(l => l.CreatedBy).LoadAsync();

        return (ToDto(log), null);
    }

    public async Task<(FuelLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateFuelLogRequest request, int updatedById)
    {
        var log = await _db.FuelLogs
            .Include(l => l.Driver)
            .Include(l => l.Vehicle)
            .Include(l => l.FuelType)
            .Include(l => l.PartyName)
            .Include(l => l.CreatedBy)
            .Include(l => l.UpdatedBy)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (log is null) return (null, null);

        var error = await Validate(request.DriverId, request.VehicleId, request.FuelTypeId, request.PartyNameId, request.PartyNameOther);
        if (error is not null) return (null, error);

        log.DriverId = request.DriverId;
        log.VehicleId = request.VehicleId;
        log.FuelTypeId = request.FuelTypeId;
        log.PartyNameId = request.PartyNameId;
        log.PartyNameOther = string.IsNullOrWhiteSpace(request.PartyNameOther) ? null : request.PartyNameOther.Trim();
        log.Quantity = request.Quantity;
        log.Price = request.Price;
        log.Date = request.Date;
        log.UpdatedById = updatedById;
        log.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(log).Reference(l => l.Driver).LoadAsync();
        await _db.Entry(log).Reference(l => l.Vehicle).LoadAsync();
        await _db.Entry(log).Reference(l => l.FuelType).LoadAsync();
        if (log.PartyNameId.HasValue) await _db.Entry(log).Reference(l => l.PartyName).LoadAsync();
        await _db.Entry(log).Reference(l => l.UpdatedBy).LoadAsync();

        return (ToDto(log), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var log = await _db.FuelLogs.FindAsync(id);
        if (log is null) return false;

        log.IsDeleted = true;
        log.DeletedById = deletedById;
        log.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> Validate(int driverId, int vehicleId, int fuelTypeId, int? partyNameId, string? partyNameOther)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == driverId))
            return "Selected driver does not exist.";
        if (!await _db.Vehicles.AnyAsync(v => v.Id == vehicleId))
            return "Selected vehicle does not exist.";
        if (!await _db.Fuels.AnyAsync(f => f.Id == fuelTypeId))
            return "Selected fuel type does not exist.";

        if (partyNameId.HasValue)
        {
            var partyName = await _db.PartyNames.FirstOrDefaultAsync(p => p.Id == partyNameId.Value);
            if (partyName is null)
                return "Selected party name does not exist.";
            if (!IsPetrolPump(partyName.Type))
                return "Selected party name is not a petrol pump.";
        }
        else if (string.IsNullOrWhiteSpace(partyNameOther))
        {
            return "Party name is required.";
        }

        return null;
    }

    private static bool IsPetrolPump(string? type)
    {
        var normalized = string.IsNullOrWhiteSpace(type) ? "other" : type.Trim().ToLowerInvariant().Replace(" ", "_");
        return normalized is "petrol_pump" or "petrolpump";
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
        PartyNameId = l.PartyNameId,
        PartyNameName = l.PartyName?.Name,
        PartyNameOther = l.PartyNameOther,
        Quantity = l.Quantity,
        Price = l.Price,
        Date = l.Date,
        CreatedBy = l.CreatedBy?.Username,
        UpdatedBy = l.UpdatedBy?.Username,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };
}
