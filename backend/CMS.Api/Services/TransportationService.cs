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
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
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
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(TransportationListItemDto? Item, string? Error)> CreateAsync(CreateTransportationRequest request, int createdById)
    {
        var error = await ValidateRequest(request.TransportedById, request.TransportedByOther, request.VehicleId, request.MaterialId, request.VendorId, request.VendorOther, request.ProjectId, request.ProjectOther);
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
            Quantity = request.Quantity,
            PerUnitCost = request.PerUnitCost,
            MaterialCost = (request.Quantity.HasValue && request.PerUnitCost.HasValue)
                ? request.Quantity.Value * request.PerUnitCost.Value
                : null,
            Tax = request.Tax,
            Wages = request.Wages,
            Date = request.Date,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.Transportations.Add(item);

        if (request.TransportedById.HasValue && request.Wages > 0)
            await _salaryDetailService.AdjustAsync(request.TransportedById.Value, totalSalaryDelta: request.Wages ?? 0m);

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(t => t.TransportedBy).LoadAsync();
        if (item.VehicleId.HasValue) await _db.Entry(item).Reference(t => t.Vehicle).LoadAsync();
        if (item.MaterialId.HasValue) await _db.Entry(item).Reference(t => t.Material).LoadAsync();
        if (item.VendorId.HasValue) await _db.Entry(item).Reference(t => t.Vendor).LoadAsync();
        if (item.ProjectId.HasValue) await _db.Entry(item).Reference(t => t.Project).LoadAsync();
        await _db.Entry(item).Reference(t => t.CreatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(TransportationListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateTransportationRequest request, int updatedById)
    {
        var item = await _db.Transportations
            .Include(t => t.TransportedBy)
            .Include(t => t.Vehicle)
            .Include(t => t.Vendor)
            .Include(t => t.Project)
            .Include(t => t.CreatedBy)
            .Include(t => t.UpdatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (item is null) return (null, null);

        var error = await ValidateRequest(request.TransportedById, request.TransportedByOther, request.VehicleId, request.MaterialId, request.VendorId, request.VendorOther, request.ProjectId, request.ProjectOther);
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
        item.Quantity = request.Quantity;
        item.PerUnitCost = request.PerUnitCost;
        item.MaterialCost = (request.Quantity.HasValue && request.PerUnitCost.HasValue)
            ? request.Quantity.Value * request.PerUnitCost.Value
            : null;
        item.Tax = request.Tax;
        item.Wages = request.Wages;
        item.Date = request.Date;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        var oldWagesValue = oldWages ?? 0m;
        var newWagesValue = request.Wages ?? 0m;

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
        await _db.Entry(item).Reference(t => t.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.Transportations.FindAsync(id);
        if (item is null) return false;
        if (item.TransportedById.HasValue && item.Wages is { } wages && wages != 0)
            await _salaryDetailService.AdjustAsync(item.TransportedById.Value, totalSalaryDelta: -wages);

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> ValidateRequest(int? transportedById, string? transportedByOther, int? vehicleId, int? materialId, int? vendorId, string? vendorOther, int? projectId, string? projectOther)
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
        Quantity = t.Quantity,
        PerUnitCost = t.PerUnitCost,
        MaterialCost = t.MaterialCost,
        Tax = t.Tax,
        Wages = t.Wages,
        Date = t.Date,
        CreatedBy = t.CreatedBy?.Username,
        UpdatedBy = t.UpdatedBy?.Username,
        CreatedAt = t.CreatedAt,
        UpdatedAt = t.UpdatedAt
    };
}
