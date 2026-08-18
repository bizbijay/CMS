using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class TransportationService : ITransportationService
{
    private readonly AppDbContext _db;
    private readonly ISalaryDetailService _salaryDetailService;

    public TransportationService(AppDbContext db, ISalaryDetailService salaryDetailService)
    {
        _db = db;
        _salaryDetailService = salaryDetailService;
    }

    public async Task<IEnumerable<TransportationListItemDto>> GetAllAsync()
    {
        var items = await _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Material)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<PagedResultDto<TransportationListItemDto>> GetPagedAsync(TransportationPagedRequest request)
    {
        var query = _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Material)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .AsQueryable();

        if (request.TransportedById.HasValue && request.TransportedById.Value > 0)
        {
            query = query.Where(t => t.TransportedById == request.TransportedById.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.TransportedByName))
        {
            var nameTrimmed = request.TransportedByName.Trim();
            query = query.Where(t =>
                (t.TransportedBy != null &&
                 (t.TransportedBy.Username == nameTrimmed ||
                  (t.TransportedBy.FirstName + " " + t.TransportedBy.LastName).Trim() == nameTrimmed ||
                  t.TransportedBy.FirstName == nameTrimmed)) ||
                (t.TransportedByOther != null && t.TransportedByOther == nameTrimmed));
        }

        if (request.VehicleId.HasValue && request.VehicleId.Value > 0)
        {
            query = query.Where(t => t.VehicleId == request.VehicleId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(request.VehicleName))
        {
            var vehicleTrimmed = request.VehicleName.Trim();
            query = query.Where(t =>
                (t.Vehicle != null && t.Vehicle.Name == vehicleTrimmed) ||
                (t.VehicleOther != null && t.VehicleOther == vehicleTrimmed));
        }

        if (request.ProjectId.HasValue && request.ProjectId.Value > 0)
        {
            query = query.Where(t => t.ProjectId == request.ProjectId.Value);
        }

        var totalCount = await query.CountAsync();

        var desc = request.SortDescending;
        query = (request.SortBy?.ToLowerInvariant()) switch
        {
            "transportedbyname" or "transportedby" => desc
                ? query.OrderByDescending(t => t.TransportedBy != null ? (t.TransportedBy.FirstName + " " + t.TransportedBy.LastName).Trim() : (t.TransportedByOther ?? "")).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.TransportedBy != null ? (t.TransportedBy.FirstName + " " + t.TransportedBy.LastName).Trim() : (t.TransportedByOther ?? "")).ThenBy(t => t.Date),
            "vehiclename" or "vehicle" => desc
                ? query.OrderByDescending(t => t.Vehicle != null ? t.Vehicle.Name : (t.VehicleOther ?? "")).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Vehicle != null ? t.Vehicle.Name : (t.VehicleOther ?? "")).ThenBy(t => t.Date),
            "materialname" or "material" => desc
                ? query.OrderByDescending(t => t.Material != null ? t.Material.Name : "").ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Material != null ? t.Material.Name : "").ThenBy(t => t.Date),
            "vendorname" or "vendor" => desc
                ? query.OrderByDescending(t => t.Vendor != null ? t.Vendor.Name : (t.VendorOther ?? "")).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Vendor != null ? t.Vendor.Name : (t.VendorOther ?? "")).ThenBy(t => t.Date),
            "projectname" or "project" => desc
                ? query.OrderByDescending(t => t.Project != null ? t.Project.Name : (t.ProjectOther ?? "")).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Project != null ? t.Project.Name : (t.ProjectOther ?? "")).ThenBy(t => t.Date),
            "partynamename" or "partyname" or "party" => desc
                ? query.OrderByDescending(t => t.PartyName != null ? t.PartyName.Name : "").ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.PartyName != null ? t.PartyName.Name : "").ThenBy(t => t.Date),
            "location" => desc
                ? query.OrderByDescending(t => t.Location ?? "").ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Location ?? "").ThenBy(t => t.Date),
            "nooftip" => desc
                ? query.OrderByDescending(t => t.NoOfTip ?? 0).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.NoOfTip ?? 0).ThenBy(t => t.Date),
            "materialcost" => desc
                ? query.OrderByDescending(t => t.MaterialCost ?? 0).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.MaterialCost ?? 0).ThenBy(t => t.Date),
            "tax" => desc
                ? query.OrderByDescending(t => t.Tax ?? 0).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Tax ?? 0).ThenBy(t => t.Date),
            "wages" => desc
                ? query.OrderByDescending(t => t.Wages ?? 0).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.Wages ?? 0).ThenBy(t => t.Date),
            "totalwages" => desc
                ? query.OrderByDescending(t => t.TotalWages ?? (t.Wages ?? 0) * (t.NoOfTip ?? 1)).ThenByDescending(t => t.Date)
                : query.OrderBy(t => t.TotalWages ?? (t.Wages ?? 0) * (t.NoOfTip ?? 1)).ThenBy(t => t.Date),
            _ => desc
                ? query.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt)
                : query.OrderBy(t => t.Date).ThenBy(t => t.CreatedAt)
        };

        var pageNumber = Math.Max(1, request.PageNumber);
        var pageSize = Math.Max(1, request.PageSize);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<TransportationListItemDto>
        {
            Items = items.Select(ToDto),
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }


    public async Task<IEnumerable<TransportationListItemDto>> GetReportAsync(
        string? fromDate,
        string? toDate,
        string? transportedByName,
        string? vehicleName,
        string? materialName,
        string? vendorName,
        string? projectName,
        string? partyName)
    {
        var query = _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Material)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(fromDate) && DateOnly.TryParse(fromDate, out var from))
        {
            query = query.Where(t => t.Date >= from);
        }

        if (!string.IsNullOrWhiteSpace(toDate) && DateOnly.TryParse(toDate, out var to))
        {
            query = query.Where(t => t.Date <= to);
        }

        if (!string.IsNullOrWhiteSpace(transportedByName))
        {
            var tTrim = transportedByName.Trim();
            query = query.Where(t =>
                (t.TransportedBy != null && (t.TransportedBy.Username == tTrim || (t.TransportedBy.FirstName + " " + t.TransportedBy.LastName).Trim() == tTrim || t.TransportedBy.FirstName == tTrim)) ||
                (t.TransportedByOther != null && t.TransportedByOther == tTrim));
        }

        if (!string.IsNullOrWhiteSpace(vehicleName))
        {
            var vTrim = vehicleName.Trim();
            query = query.Where(t =>
                (t.Vehicle != null && t.Vehicle.Name == vTrim) ||
                (t.VehicleOther != null && t.VehicleOther == vTrim));
        }

        if (!string.IsNullOrWhiteSpace(materialName))
        {
            query = query.Where(t => t.Material != null && t.Material.Name == materialName.Trim());
        }

        if (!string.IsNullOrWhiteSpace(vendorName))
        {
            var vendorTrim = vendorName.Trim();
            query = query.Where(t =>
                (t.Vendor != null && t.Vendor.Name == vendorTrim) ||
                (t.VendorOther != null && t.VendorOther == vendorTrim));
        }

        if (!string.IsNullOrWhiteSpace(projectName))
        {
            var pTrim = projectName.Trim();
            query = query.Where(t =>
                (t.Project != null && t.Project.Name == pTrim) ||
                (t.ProjectOther != null && t.ProjectOther == pTrim));
        }

        if (!string.IsNullOrWhiteSpace(partyName))
        {
            query = query.Where(t => t.PartyName != null && t.PartyName.Name == partyName.Trim());
        }

        var items = await query
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();

        return items.Select(ToDto);
    }

    public async Task<IEnumerable<TransportationListItemDto>> GetByProjectAsync(int projectId)
    {
        var items = await _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Material)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .Where(t => t.ProjectId == projectId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<TransportationListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Material)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(TransportationListItemDto? Item, string? Error)> CreateAsync(CreateTransportationRequest request, int createdById)
    {
        try
        {
var error = await ValidateRequest(request.TransportedById, request.TransportedByOther, request.VehicleId, request.MaterialId, request.VendorId, request.VendorOther, request.ProjectId, request.ProjectOther, request.PartyNameId);
        if (error is not null) return (null, error);
        
        var item = new Transportation
        {
            TransportedById = request.TransportedById,
            TransportedByOther = request.TransportedById is null ? request.TransportedByOther?.Trim() : null,
            VehicleId = request.VehicleId,
            VehicleOther = request.VehicleId is null ? request.VehicleOther?.Trim() : null,
            MaterialId = request.MaterialId,
            VendorId = request.VendorId,
            VendorOther = request.VendorId is null ? request.VendorOther?.Trim() : null,
            ProjectId = request.ProjectId,
            ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null,
            Location = request.Location?.Trim(),
            PartyNameId = request.PartyNameId,
            NoOfTip = request.NoOfTip,
            Quantity = request.Quantity,
            PerUnitCost = request.PerUnitCost,
            MaterialCost = (request.Quantity.HasValue && request.PerUnitCost.HasValue)
                ? request.Quantity.Value * request.PerUnitCost.Value
                : null,
            Tax = request.Tax,
            Wages = request.Wages,
            TotalWages = request.TotalWages ?? ((request.Wages ?? 0m) * Math.Max(1, request.NoOfTip ?? 1)),
            Date = request.Date,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.Transportations.Add(item);

        var totalWagesAmount = item.TotalWages ?? 0m;
        if (request.TransportedById.HasValue && totalWagesAmount > 0)
            await _salaryDetailService.AdjustAsync(request.TransportedById.Value, totalSalaryDelta: totalWagesAmount);

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(t => t.TransportedBy).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(t => t.Vehicle).LoadAsync();
        if (item.MaterialId.HasValue) await _db.Entry(item).Reference(t => t.Material).LoadAsync();
        if (item.VendorId.HasValue) await _db.Entry(item).Reference(t => t.Vendor).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(t => t.Project).LoadAsync();
        if (item.PartyNameId.HasValue) await _db.Entry(item).Reference(t => t.PartyName).LoadAsync();
        await _db.Entry(item).Reference(t => t.CreatedBy).LoadAsync();

        return (ToDto(item), null);
        }
        catch (Exception ex)
        {

            throw;
        }
        
    }

    public async Task<(TransportationListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateTransportationRequest request, int updatedById)
    {
        var item = await _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.PartyName)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item is null) return (null, null);

        var error = await ValidateRequest(request.TransportedById, request.TransportedByOther, request.VehicleId, request.MaterialId, request.VendorId, request.VendorOther, request.ProjectId, request.ProjectOther, request.PartyNameId);
        if (error is not null) return (null, error);

        var oldTransportedById = item.TransportedById;
        var oldWages = item.Wages;

        item.TransportedById = request.TransportedById;
        item.TransportedByOther = request.TransportedById is null ? request.TransportedByOther?.Trim() : null;
        item.VehicleId = request.VehicleId;
        item.VehicleOther = request.VehicleId is null ? request.VehicleOther?.Trim() : null;
        item.MaterialId = request.MaterialId;
        item.VendorId = request.VendorId;
        item.VendorOther = request.VendorId is null ? request.VendorOther?.Trim() : null;
        item.ProjectId = request.ProjectId;
        item.ProjectOther = request.ProjectId is null ? request.ProjectOther?.Trim() : null;
        item.Location = request.Location?.Trim();
        item.PartyNameId = request.PartyNameId;
        item.NoOfTip = request.NoOfTip;
        item.Quantity = request.Quantity;
        item.PerUnitCost = request.PerUnitCost;
        item.MaterialCost = (request.Quantity.HasValue && request.PerUnitCost.HasValue)
            ? request.Quantity.Value * request.PerUnitCost.Value
            : null;
        item.Tax = request.Tax;
        item.Wages = request.Wages;
        var oldTotalWagesValue = item.TotalWages ?? ((oldWages ?? 0m) * Math.Max(1, item.NoOfTip ?? 1));
        var newTotalWagesValue = request.TotalWages ?? ((request.Wages ?? 0m) * Math.Max(1, request.NoOfTip ?? 1));
        item.TotalWages = newTotalWagesValue;
        item.Date = request.Date;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        var oldWagesValue = oldTotalWagesValue;
        var newWagesValue = newTotalWagesValue;

        // Only adjust salary when both old and new entries reference actual users
        if (oldTransportedById.HasValue && request.TransportedById.HasValue && oldTransportedById == request.TransportedById)
        {
            var delta = newWagesValue - oldWagesValue;
            if (delta != 0)
                await _salaryDetailService.AdjustAsync(request.TransportedById.Value, totalSalaryDelta: delta);
        }
        else
        {
            if (oldTransportedById.HasValue && oldWagesValue != 0)
                await _salaryDetailService.AdjustAsync(oldTransportedById.Value, totalSalaryDelta: -oldWagesValue);
            if (request.TransportedById.HasValue && newWagesValue != 0)
                await _salaryDetailService.AdjustAsync(request.TransportedById.Value, totalSalaryDelta: newWagesValue);
        }

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(t => t.TransportedBy).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(t => t.Vehicle).LoadAsync();
        if (item.MaterialId.HasValue) await _db.Entry(item).Reference(t => t.Material).LoadAsync();
        if (item.VendorId.HasValue) await _db.Entry(item).Reference(t => t.Vendor).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(t => t.Project).LoadAsync();
        if (item.PartyNameId.HasValue) await _db.Entry(item).Reference(t => t.PartyName).LoadAsync();
        await _db.Entry(item).Reference(t => t.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.Transportations.FindAsync(id);
        if (item is null) return false;
        var deletedTotalWages = item.TotalWages ?? ((item.Wages ?? 0m) * Math.Max(1, item.NoOfTip ?? 1));
        if (item.TransportedById.HasValue && deletedTotalWages != 0)
            await _salaryDetailService.AdjustAsync(item.TransportedById.Value, totalSalaryDelta: -deletedTotalWages);

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> ValidateRequest(int? transportedById, string? transportedByOther, int? vehicleId, int? materialId, int? vendorId, string? vendorOther, int? projectId, string? projectOther, int? partyNameId)
    {
        try
        {
            if (transportedById.HasValue)
            {
                if (!await _db.Users.AnyAsync(u => u.Id == transportedById.Value))
                    return "Selected user does not exist.";
            }
            else if (string.IsNullOrWhiteSpace(transportedByOther))
            {
                return "Transported by is required.";
            }

            if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
                return "Selected vehicle does not exist.";

            if (materialId.HasValue && !await _db.Materials.AnyAsync(m => m.Id == materialId.Value))
                return "Selected material does not exist.";

            if (vendorId.HasValue)
            {
                if (!await _db.Vendors.AnyAsync(v => v.Id == vendorId.Value))
                    return "Selected vendor does not exist.";
            }
            else if (string.IsNullOrWhiteSpace(vendorOther))
            {
                return "Vendor is required.";
            }

            if (projectId.HasValue)
            {
                if (!await _db.Projects.AnyAsync(p => p.Id == projectId.Value))
                    return "Selected project does not exist.";
            }

            if (partyNameId.HasValue)
            {
                if (!await _db.PartyNames.AnyAsync(p => p.Id == partyNameId.Value))
                    return "Selected party name does not exist.";
            }

            var hasProjectReference = projectId.HasValue || !string.IsNullOrWhiteSpace(projectOther);
            var hasPartyReference = partyNameId.HasValue;
            if (!hasProjectReference && !hasPartyReference)
                return "Project or party name is required.";

            return null;
        }
        catch (Exception ex)
        {

            throw;
        }
        
    }

    private static string UserDisplayName(User? u) =>
        u is null ? "—" :
        string.IsNullOrWhiteSpace($"{u.FirstName} {u.LastName}".Trim())
            ? u.Username
            : $"{u.FirstName} {u.LastName}".Trim();

    private static TransportationListItemDto ToDto(Transportation t) => new()
    {
        Id = t.Id,
        TransportedById = t.TransportedById,
        TransportedByName = t.TransportedBy is not null ? UserDisplayName(t.TransportedBy) : t.TransportedByOther ?? "—",
        TransportedByOther = t.TransportedByOther,
        VehicleId = t.VehicleId,
        VehicleName = t.Vehicle is null ? null : $"{t.Vehicle.Name} ({t.Vehicle.NumberPlate})",
        VehicleOther = t.VehicleOther,
        MaterialId = t.MaterialId,
        MaterialName = t.Material?.Name,
        VendorId = t.VendorId,
        VendorName = t.Vendor?.Name ?? t.VendorOther ?? string.Empty,
        VendorOther = t.VendorOther,
        ProjectId = t.ProjectId,
        ProjectName = t.Project?.Name ?? t.ProjectOther ?? string.Empty,
        ProjectOther = t.ProjectOther,
        Location = t.Location,
        PartyNameId = t.PartyNameId,
        PartyNameName = t.PartyName?.Name,
        NoOfTip = t.NoOfTip,
        Quantity = t.Quantity,
        PerUnitCost = t.PerUnitCost,
        MaterialCost = t.MaterialCost,
        Tax = t.Tax,
        Wages = t.Wages,
        TotalWages = t.TotalWages ?? ((t.Wages ?? 0m) * Math.Max(1, t.NoOfTip ?? 1)),
        Date = t.Date,
        CreatedBy = t.CreatedBy?.Username,
        UpdatedBy = t.UpdatedBy?.Username,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt
    };
}
