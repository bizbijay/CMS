using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class DozerLogService : IDozerLogService
{
    private readonly AppDbContext _db;
    private readonly ISalaryDetailService _salaryDetailService;

    public DozerLogService(AppDbContext db, ISalaryDetailService salaryDetailService)
    {
        _db = db;
        _salaryDetailService = salaryDetailService;
    }

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
        try
        {
            var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther, request.StartMeter, request.EndMeter);
            if (error is not null) return (null, error);

            var totalMeterRun = request.EndMeter - request.StartMeter;

            var item = new DozerLog
            {
                DriverId = request.DriverId,
                VehicleId = request.VehicleId,
                OperationDate = request.OperationDate,
                StartMeter = request.StartMeter,
                EndMeter = request.EndMeter,
                TotalMeterRun = totalMeterRun,
                ProjectId = request.ProjectId,
                ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null,
                Wages = request.Wages,
                CreatedById = createdById,
                CreatedAt = DateTime.UtcNow
            };

            _db.DozerLogs.Add(item);

            if (request.Wages > 0)
                await _salaryDetailService.AdjustAsync(request.DriverId, totalSalaryDelta: request.Wages ?? 0m);

            await _db.SaveChangesAsync();

            await _db.Entry(item).Reference(d => d.Driver).LoadAsync();
            if (item.VehicleId.HasValue) await _db.Entry(item).Reference(d => d.Vehicle).LoadAsync();
            if (item.ProjectId.HasValue) await _db.Entry(item).Reference(d => d.Project).LoadAsync();
            await _db.Entry(item).Reference(d => d.CreatedBy).LoadAsync();

            return (ToDto(item), null);

        }
        catch (Exception ex)
        {

            throw;
        }
        
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

        var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther, request.StartMeter, request.EndMeter);
        if (error is not null) return (null, error);

        var oldDriverId = item.DriverId;
        var oldWages = item.Wages;

        var totalMeterRun = request.EndMeter - request.StartMeter;

        item.DriverId = request.DriverId;
        item.VehicleId = request.VehicleId;
        item.OperationDate = request.OperationDate;
        item.StartMeter = request.StartMeter;
        item.EndMeter = request.EndMeter;
        item.TotalMeterRun = totalMeterRun;
        item.ProjectId = request.ProjectId;
        item.ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null;
        item.Wages = request.Wages;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        var oldWagesValue = oldWages ?? 0m;
        var newWagesValue = request.Wages ?? 0m;

        if (oldDriverId == request.DriverId)
        {
            var delta = newWagesValue - oldWagesValue;
            if (delta != 0)
                await _salaryDetailService.AdjustAsync(request.DriverId, totalSalaryDelta: delta);
        }
        else
        {
            if (oldWagesValue != 0)
                await _salaryDetailService.AdjustAsync(oldDriverId, totalSalaryDelta: -oldWagesValue);
            if (newWagesValue != 0)
                await _salaryDetailService.AdjustAsync(request.DriverId, totalSalaryDelta: newWagesValue);
        }

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(d => d.Driver).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(d => d.Vehicle).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(d => d.Project).LoadAsync();
        await _db.Entry(item).Reference(d => d.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.DozerLogs.FindAsync(id);
        if (item is null) return false;
        if (item.Wages is { } wages && wages != 0)
            await _salaryDetailService.AdjustAsync(item.DriverId, totalSalaryDelta: -wages);

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> ValidateRequest(int driverId, int? vehicleId, int? projectId, string? projectOther, decimal startMeter, decimal endMeter)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == driverId))
            return "Selected driver does not exist.";

        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
            return "Selected vehicle does not exist.";

        if (endMeter <= startMeter)
            return "End meter must be greater than start meter.";

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
        StartMeter = d.StartMeter,
        EndMeter = d.EndMeter,
        TotalMeterRun = d.TotalMeterRun,
        ProjectId = d.ProjectId,
        ProjectName = d.Project?.Name ?? d.ProjectOther ?? string.Empty,
        ProjectOther = d.ProjectOther,
        Wages = d.Wages,
        CreatedBy = d.CreatedBy?.Username,
        UpdatedBy = d.UpdatedBy?.Username,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt
    };
}
