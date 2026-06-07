using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class DozerLogService : IDozerLogService
{
    private readonly AppDbContext _db;
    public DozerLogService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<DozerLogListItemDto>> GetAllAsync()
    {
        var items = await _db.DozerLogs
            .Include(d => d.Driver)
            .Include(d => d.Vehicle)
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .OrderByDescending(d => d.OperationDate)
            .ThenByDescending(d => d.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<DozerLogListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.DozerLogs
            .Include(d => d.Driver)
            .Include(d => d.Vehicle)
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(DozerLogListItemDto? Item, string? Error)> CreateAsync(CreateDozerLogRequest request, int createdById)
    {
        var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther);
        if (error is not null) return (null, error);

        var item = new DozerLog
        {
            DriverId = request.DriverId,
            VehicleId = request.VehicleId,
            OperationDate = request.OperationDate,
            OperatedTimeMs = request.OperatedTimeMs,
            ProjectId = request.ProjectId,
            ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.DozerLogs.Add(item);
        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(d => d.Driver).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(d => d.Vehicle).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(d => d.Project).LoadAsync();
        await _db.Entry(item).Reference(d => d.CreatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(DozerLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateDozerLogRequest request, int updatedById)
    {
        var item = await _db.DozerLogs
            .Include(d => d.Driver)
            .Include(d => d.Vehicle)
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (item is null) return (null, null);

        var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther);
        if (error is not null) return (null, error);

        item.DriverId = request.DriverId;
        item.VehicleId = request.VehicleId;
        item.OperationDate = request.OperationDate;
        item.OperatedTimeMs = request.OperatedTimeMs;
        item.ProjectId = request.ProjectId;
        item.ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(d => d.Driver).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(d => d.Vehicle).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(d => d.Project).LoadAsync();
        await _db.Entry(item).Reference(d => d.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var item = await _db.DozerLogs.FindAsync(id);
        if (item is null) return false;
        _db.DozerLogs.Remove(item);
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> ValidateRequest(int driverId, int? vehicleId, int? projectId, string? projectOther)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == driverId))
            return "Selected driver does not exist.";

        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
            return "Selected vehicle does not exist.";

        if (projectId.HasValue)
        {
            if (!await _db.Projects.AnyAsync(p => p.Id == projectId.Value))
                return "Selected project does not exist.";
        }
        else if (string.IsNullOrWhiteSpace(projectOther))
        {
            return "Project is required.";
        }

        return null;
    }

    private static string UserDisplayName(User? u) =>
        u is null ? "—" :
        string.IsNullOrWhiteSpace($"{u.FirstName} {u.LastName}".Trim())
            ? u.Username
            : $"{u.FirstName} {u.LastName}".Trim();

    private static DozerLogListItemDto ToDto(DozerLog d) => new()
    {
        Id = d.Id,
        DriverId = d.DriverId,
        DriverName = UserDisplayName(d.Driver),
        VehicleId = d.VehicleId,
        VehicleName = d.Vehicle is null ? null : $"{d.Vehicle.Name} ({d.Vehicle.NumberPlate})",
        OperationDate = d.OperationDate,
        OperatedTimeMs = d.OperatedTimeMs,
        ProjectId = d.ProjectId,
        ProjectName = d.Project?.Name ?? d.ProjectOther ?? string.Empty,
        ProjectOther = d.ProjectOther,
        CreatedBy = d.CreatedBy?.Username,
        UpdatedBy = d.UpdatedBy?.Username,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt
    };
}
