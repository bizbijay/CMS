using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class ProjectCommissionService : IProjectCommissionService
{
    private readonly AppDbContext _db;
    public ProjectCommissionService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ProjectCommissionListItemDto>> GetByProjectAsync(int projectId)
    {
        var items = await _db.ProjectCommissions
            .Where(c => c.ProjectId == projectId)
            .Include(c => c.Office)
            .Include(c => c.CreatedBy)
            .Include(c => c.UpdatedBy)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<ProjectCommissionListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.ProjectCommissions
            .Include(c => c.Office)
            .Include(c => c.CreatedBy)
            .Include(c => c.UpdatedBy)
            .FirstOrDefaultAsync(c => c.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(ProjectCommissionListItemDto? Item, string? Error)> CreateAsync(CreateProjectCommissionRequest request, int createdById)
    {
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == request.ProjectId);
        if (!projectExists) return (null, "Project not found.");

        if (request.OfficeId.HasValue)
        {
            var officeExists = await _db.GovernmentOffices.AnyAsync(o => o.Id == request.OfficeId.Value);
            if (!officeExists) return (null, "Government office not found.");
        }

        var commission = new ProjectCommission
        {
            ProjectId = request.ProjectId,
            OfficeId = request.OfficeId,
            OtherOption = request.OtherOption?.Trim(),
            Amount = request.Amount,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.ProjectCommissions.Add(commission);
        await _db.SaveChangesAsync();
        await _db.Entry(commission).Reference(c => c.CreatedBy).LoadAsync();
        if (commission.OfficeId.HasValue)
            await _db.Entry(commission).Reference(c => c.Office).LoadAsync();
        return (ToDto(commission), null);
    }

    public async Task<(ProjectCommissionListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectCommissionRequest request, int updatedById)
    {
        var commission = await _db.ProjectCommissions
            .Include(c => c.Office)
            .Include(c => c.CreatedBy)
            .Include(c => c.UpdatedBy)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (commission is null) return (null, null);

        if (request.OfficeId.HasValue)
        {
            var officeExists = await _db.GovernmentOffices.AnyAsync(o => o.Id == request.OfficeId.Value);
            if (!officeExists) return (null, "Government office not found.");
        }

        commission.OfficeId = request.OfficeId;
        commission.OtherOption = request.OtherOption?.Trim();
        commission.Amount = request.Amount;
        commission.Remarks = request.Remarks?.Trim();
        commission.UpdatedById = updatedById;
        commission.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(commission).Reference(c => c.UpdatedBy).LoadAsync();
        if (commission.OfficeId.HasValue)
            await _db.Entry(commission).Reference(c => c.Office).LoadAsync();
        return (ToDto(commission), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var commission = await _db.ProjectCommissions.FindAsync(id);
        if (commission is null) return false;
        commission.IsDeleted = true;
        commission.DeletedById = deletedById;
        commission.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProjectCommissionListItemDto ToDto(ProjectCommission c) => new()
    {
        Id = c.Id,
        ProjectId = c.ProjectId,
        OfficeId = c.OfficeId,
        OfficeName = c.Office?.Name,
        OtherOption = c.OtherOption,
        Amount = c.Amount,
        Remarks = c.Remarks,
        CreatedBy = c.CreatedBy?.Username,
        UpdatedBy = c.UpdatedBy?.Username,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt
    };
}
