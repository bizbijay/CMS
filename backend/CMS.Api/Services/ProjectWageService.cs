using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class ProjectWageService : IProjectWageService
{
    private readonly AppDbContext _db;

    public ProjectWageService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ProjectWageListItemDto>> GetByProjectAsync(int projectId)
    {
        var items = await _db.ProjectWages
            .Include(w => w.Project)
            .Include(w => w.CreatedBy)
            .Include(w => w.UpdatedBy)
            .Where(w => w.ProjectId == projectId)
            .OrderByDescending(w => w.Date)
            .ThenByDescending(w => w.CreatedAt)
            .ToListAsync();
        return items.Select(ToDto);
    }

    public async Task<ProjectWageListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.ProjectWages
            .Include(w => w.Project)
            .Include(w => w.CreatedBy)
            .Include(w => w.UpdatedBy)
            .FirstOrDefaultAsync(w => w.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<(ProjectWageListItemDto? Item, string? Error)> CreateAsync(CreateProjectWageRequest request, int createdById)
    {
        if (!await _db.Projects.AnyAsync(p => p.Id == request.ProjectId))
            return (null, "Selected project does not exist.");

        var item = new ProjectWage
        {
            ProjectId = request.ProjectId,
            NumberOfWorkers = request.NumberOfWorkers,
            Rate = request.Rate,
            TotalAmount = request.NumberOfWorkers * request.Rate,
            Date = request.Date,
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProjectWages.Add(item);
        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(w => w.Project).LoadAsync();
        await _db.Entry(item).Reference(w => w.CreatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(ProjectWageListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectWageRequest request, int updatedById)
    {
        var item = await _db.ProjectWages
            .Include(w => w.Project)
            .Include(w => w.UpdatedBy)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (item is null) return (null, null);

        item.NumberOfWorkers = request.NumberOfWorkers;
        item.Rate = request.Rate;
        item.TotalAmount = request.NumberOfWorkers * request.Rate;
        item.Date = request.Date;
        item.Remarks = request.Remarks?.Trim();
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(w => w.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.ProjectWages.FindAsync(id);
        if (item is null) return false;
        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static ProjectWageListItemDto ToDto(ProjectWage w) => new()
    {
        Id = w.Id,
        ProjectId = w.ProjectId,
        ProjectName = w.Project?.Name ?? string.Empty,
        NumberOfWorkers = w.NumberOfWorkers,
        Rate = w.Rate,
        TotalAmount = w.TotalAmount,
        Date = w.Date,
        Remarks = w.Remarks,
        CreatedBy = w.CreatedBy?.Username,
        UpdatedBy = w.UpdatedBy?.Username,
        CreatedAt = w.CreatedAt,
        UpdatedAt = w.UpdatedAt
    };
}
