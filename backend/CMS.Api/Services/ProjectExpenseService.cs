using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class ProjectExpenseService : IProjectExpenseService
{
    private readonly AppDbContext _db;

    public ProjectExpenseService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ProjectExpenseListItemDto>> GetByProjectAsync(int projectId)
    {
        var items = await _db.ProjectExpenses
            .Include(e => e.Project)
            .Include(e => e.Material)
            .Include(e => e.Vendor)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .Where(e => e.ProjectId == projectId)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<ProjectExpenseListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.ProjectExpenses
            .Include(e => e.Project)
            .Include(e => e.Material)
            .Include(e => e.Vendor)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .FirstOrDefaultAsync(e => e.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(ProjectExpenseListItemDto? Item, string? Error)> CreateAsync(CreateProjectExpenseRequest request, int createdById)
    {
        var error = await ValidateRequest(request.ProjectId, request.MaterialId, request.VendorId, request.VendorOther);
        if (error is not null) return (null, error);

        var item = new ProjectExpense
        {
            ProjectId = request.ProjectId,
            MaterialId = request.MaterialId,
            Quantity = request.Quantity,
            CostPerUnit = request.CostPerUnit,
            TotalCost = (request.Quantity.HasValue && request.CostPerUnit.HasValue)
                ? request.Quantity.Value * request.CostPerUnit.Value
                : null,
            VendorId = request.VendorId,
            VendorOther = request.VendorId is null ? request.VendorOther?.Trim() : null,
            Date = request.Date,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProjectExpenses.Add(item);
        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(e => e.Project).LoadAsync();
        if (item.MaterialId.HasValue) await _db.Entry(item).Reference(e => e.Material).LoadAsync();
        if (item.VendorId.HasValue) await _db.Entry(item).Reference(e => e.Vendor).LoadAsync();
        await _db.Entry(item).Reference(e => e.CreatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(ProjectExpenseListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectExpenseRequest request, int updatedById)
    {
        var item = await _db.ProjectExpenses
            .Include(e => e.Project)
            .Include(e => e.Material)
            .Include(e => e.Vendor)
            .Include(e => e.UpdatedBy)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (item is null) return (null, null);

        var error = await ValidateRequest(item.ProjectId, request.MaterialId, request.VendorId, request.VendorOther);
        if (error is not null) return (null, error);

        item.MaterialId = request.MaterialId;
        item.Quantity = request.Quantity;
        item.CostPerUnit = request.CostPerUnit;
        item.TotalCost = (request.Quantity.HasValue && request.CostPerUnit.HasValue)
            ? request.Quantity.Value * request.CostPerUnit.Value
            : null;
        item.VendorId = request.VendorId;
        item.VendorOther = request.VendorId is null ? request.VendorOther?.Trim() : null;
        item.Date = request.Date;
        item.Remarks = request.Remarks?.Trim();
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (item.MaterialId.HasValue) await _db.Entry(item).Reference(e => e.Material).LoadAsync();
        if (item.VendorId.HasValue) await _db.Entry(item).Reference(e => e.Vendor).LoadAsync();
        await _db.Entry(item).Reference(e => e.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.ProjectExpenses.FindAsync(id);
        if (item is null) return false;
        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private async Task<string?> ValidateRequest(int projectId, int? materialId, int? vendorId, string? vendorOther)
    {
        if (!await _db.Projects.AnyAsync(p => p.Id == projectId))
            return "Selected project does not exist.";
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
        return null;
    }

    private static ProjectExpenseListItemDto ToDto(ProjectExpense e) => new()
    {
        Id = e.Id,
        ProjectId = e.ProjectId,
        ProjectName = e.Project?.Name ?? string.Empty,
        MaterialId = e.MaterialId,
        MaterialName = e.Material?.Name,
        Quantity = e.Quantity,
        CostPerUnit = e.CostPerUnit,
        TotalCost = e.TotalCost,
        VendorId = e.VendorId,
        VendorName = e.Vendor?.Name ?? e.VendorOther,
        VendorOther = e.VendorOther,
        Date = e.Date,
        Remarks = e.Remarks,
        CreatedBy = e.CreatedBy?.Username,
        UpdatedBy = e.UpdatedBy?.Username,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt
    };
}
