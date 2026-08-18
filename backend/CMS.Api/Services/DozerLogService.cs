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
            .Include(d => d.PartyName)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .OrderByDescending(d => d.OperationDate)
            .ThenByDescending(d => d.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<PagedResultDto<DozerLogListItemDto>> GetPagedAsync(DozerLogPagedRequest request)
    {
        var query = _db.DozerLogs
            .Include(d => d.Driver)
            .Include(d => d.Vehicle)
            .Include(d => d.Project)
            .Include(d => d.PartyName)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .AsQueryable();

        if (request.DriverId.HasValue && request.DriverId.Value > 0)
        {
            query = query.Where(d => d.DriverId == request.DriverId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.DriverName))
        {
            var nameTrimmed = request.DriverName.Trim();
            query = query.Where(d => d.Driver != null &&
                (d.Driver.Username == nameTrimmed ||
                 (d.Driver.FirstName + " " + d.Driver.LastName).Trim() == nameTrimmed ||
                 d.Driver.FirstName == nameTrimmed));
        }

        if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
        {
            query = query.Where(d => d.VehicleId == request.VehicleId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.VehicleName))
        {
            var vehicleTrimmed = request.VehicleName.Trim();
            query = query.Where(d => d.Vehicle != null && d.Vehicle.Name == vehicleTrimmed);
        }

        var totalCount = await query.CountAsync();

        var desc = request.SortDescending;
        query = (request.SortBy?.ToLowerInvariant()) switch
        {
            "drivername" or "driver" or "operator" => desc
                ? query.OrderByDescending(d => d.Driver != null ? (d.Driver.FirstName + " " + d.Driver.LastName).Trim() : "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.Driver != null ? (d.Driver.FirstName + " " + d.Driver.LastName).Trim() : "").ThenBy(d => d.OperationDate),
            "vehiclename" or "vehicle" => desc
                ? query.OrderByDescending(d => d.Vehicle != null ? d.Vehicle.Name : "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.Vehicle != null ? d.Vehicle.Name : "").ThenBy(d => d.OperationDate),
            "totalmeterrun" or "meterrun" => desc
                ? query.OrderByDescending(d => d.EndMeter - d.StartMeter).ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.EndMeter - d.StartMeter).ThenBy(d => d.OperationDate),
            "projectname" or "project" => desc
                ? query.OrderByDescending(d => d.Project != null ? d.Project.Name : (d.ProjectOther ?? "")).ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.Project != null ? d.Project.Name : (d.ProjectOther ?? "")).ThenBy(d => d.OperationDate),
            "partynamename" or "partyname" or "party" => desc
                ? query.OrderByDescending(d => d.PartyName != null ? d.PartyName.Name : "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.PartyName != null ? d.PartyName.Name : "").ThenBy(d => d.OperationDate),
            "location" => desc
                ? query.OrderByDescending(d => d.Location ?? "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.Location ?? "").ThenBy(d => d.OperationDate),
            "paymenttype" => desc
                ? query.OrderByDescending(d => d.PaymentType ?? "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.PaymentType ?? "").ThenBy(d => d.OperationDate),
            "workorderby" => desc
                ? query.OrderByDescending(d => d.WorkOrderBy ?? "").ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.WorkOrderBy ?? "").ThenBy(d => d.OperationDate),
            "wages" => desc
                ? query.OrderByDescending(d => d.Wages ?? 0).ThenByDescending(d => d.OperationDate)
                : query.OrderBy(d => d.Wages ?? 0).ThenBy(d => d.OperationDate),
            _ => desc
                ? query.OrderByDescending(d => d.OperationDate).ThenByDescending(d => d.CreatedAt)
                : query.OrderBy(d => d.OperationDate).ThenBy(d => d.CreatedAt)
        };

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Max(1, request.PageSize);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<DozerLogListItemDto>
        {
            Items = items.Select(ToDto),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }


    public async Task<IEnumerable<DozerLogListItemDto>> GetReportAsync(
        string? fromDate,
        string? toDate,
        string? driverName,
        string? vehicleName,
        string? projectName,
        string? partyName)
    {
        var query = _db.DozerLogs
            .Include(d => d.Driver)
            .Include(d => d.Vehicle)
            .Include(d => d.Project)
            .Include(d => d.PartyName)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(fromDate) && DateOnly.TryParse(fromDate, out var from))
        {
            query = query.Where(d => d.OperationDate >= from);
        }

        if (!string.IsNullOrWhiteSpace(toDate) && DateOnly.TryParse(toDate, out var to))
        {
            query = query.Where(d => d.OperationDate <= to);
        }

        if (!string.IsNullOrWhiteSpace(driverName))
        {
            var dTrim = driverName.Trim();
            query = query.Where(d => d.Driver != null &&
                (d.Driver.Username == dTrim ||
                 (d.Driver.FirstName + " " + d.Driver.LastName).Trim() == dTrim ||
                 d.Driver.FirstName == dTrim));
        }

        if (!string.IsNullOrWhiteSpace(vehicleName))
        {
            query = query.Where(d => d.Vehicle != null && d.Vehicle.Name == vehicleName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(projectName))
        {
            var pTrim = projectName.Trim();
            query = query.Where(d =>
                (d.Project != null && d.Project.Name == pTrim) ||
                (d.ProjectOther != null && d.ProjectOther == pTrim));
        }

        if (!string.IsNullOrWhiteSpace(partyName))
        {
            query = query.Where(d => d.PartyName != null && d.PartyName.Name == partyName.Trim());
        }

        var items = await query
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
            .Include(d => d.PartyName)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(DozerLogListItemDto? Item, string? Error)> CreateAsync(CreateDozerLogRequest request, int createdById)
    {
        try
        {
            var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther, request.StartMeter, request.EndMeter, request.PartyNameId);
            if (error is not null) return (null, error);

            var totalMeterRun = request.EndMeter - request.StartMeter;
            var isCash = string.Equals(request.PaymentType?.Trim(), "Cash", StringComparison.OrdinalIgnoreCase);

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
                PartyNameId = request.PartyNameId,
                Location = request.Location?.Trim(),
                PaymentType = request.PaymentType?.Trim(),
                CashAmount = isCash ? request.CashAmount : null,
                WorkOrderBy = request.WorkOrderBy?.Trim(),
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
            if (item.PartyNameId.HasValue) await _db.Entry(item).Reference(d => d.PartyName).LoadAsync();
            await _db.Entry(item).Reference(d => d.CreatedBy).LoadAsync();

            return (ToDto(item), null);

        }
        catch (Exception)
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
            .Include(d => d.PartyName)
            .Include(d => d.CreatedBy)
            .Include(d => d.UpdatedBy)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (item is null) return (null, null);

        var error = await ValidateRequest(request.DriverId, request.VehicleId, request.ProjectId, request.ProjectOther, request.StartMeter, request.EndMeter, request.PartyNameId);
        if (error is not null) return (null, error);

        var oldDriverId = item.DriverId;
        var oldWages = item.Wages;

        var totalMeterRun = request.EndMeter - request.StartMeter;
        var isCash = string.Equals(request.PaymentType?.Trim(), "Cash", StringComparison.OrdinalIgnoreCase);

        item.DriverId = request.DriverId;
        item.VehicleId = request.VehicleId;
        item.OperationDate = request.OperationDate;
        item.StartMeter = request.StartMeter;
        item.EndMeter = request.EndMeter;
        item.TotalMeterRun = totalMeterRun;
        item.ProjectId = request.ProjectId;
        item.ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null;
        item.Wages = request.Wages;
        item.PartyNameId = request.PartyNameId;
        item.Location = request.Location?.Trim();
        item.PaymentType = request.PaymentType?.Trim();
        item.CashAmount = isCash ? request.CashAmount : null;
        item.WorkOrderBy = request.WorkOrderBy?.Trim();
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
        if (item.PartyNameId.HasValue) await _db.Entry(item).Reference(d => d.PartyName).LoadAsync();
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

    private async Task<string?> ValidateRequest(int driverId, int? vehicleId, int? projectId, string? projectOther, decimal startMeter, decimal endMeter, int? partyNameId)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == driverId))
            return "Selected driver does not exist.";

        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
            return "Selected vehicle does not exist.";

        if (endMeter <= startMeter)
            return "End meter must be greater than start meter.";

        if (partyNameId.HasValue)
        {
            if (!await _db.PartyNames.AnyAsync(p => p.Id == partyNameId.Value))
                return "Selected party name does not exist.";
        }
        else if (projectId.HasValue)
        {
            if (!await _db.Projects.AnyAsync(p => p.Id == projectId.Value))
                return "Selected project does not exist.";
        }
        else if (string.IsNullOrWhiteSpace(projectOther))
        {
            return "Project or Party Name is required.";
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
        PartyNameId = d.PartyNameId,
        PartyNameName = d.PartyName?.Name,
        Location = d.Location,
        PaymentType = d.PaymentType,
        CashAmount = d.CashAmount,
        WorkOrderBy = d.WorkOrderBy,
        CreatedBy = d.CreatedBy?.Username,
        UpdatedBy = d.UpdatedBy?.Username,
        CreatedAt = d.CreatedAt,
        UpdatedAt = d.UpdatedAt
    };
}
