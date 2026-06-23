using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;
    public ProjectService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<ProjectListItemDto>> GetAllAsync()
    {
        var projects = await _db.Projects
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .OrderByDescending(p => p.CreatedAt).ToListAsync();
        return projects.Select(ToDto);
    }

    public async Task<ProjectListItemDto?> GetByIdAsync(int id)
    {
        var project = await _db.Projects
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
        return project is null ? null : ToDto(project);
    }

    public async Task<ProjectListItemDto> CreateAsync(CreateProjectRequest request, int createdById)
    {
        var project = new Project
        {
            Name = request.Name.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();
        await _db.Entry(project).Reference(p => p.CreatedBy).LoadAsync();
        return ToDto(project);
    }

    public async Task<(ProjectListItemDto? Project, string? Error)> UpdateAsync(int id, UpdateProjectRequest request, int updatedById)
    {
        var project = await _db.Projects
            .Include(p => p.CreatedBy).Include(p => p.UpdatedBy)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (project is null) return (null, null);

        project.Name = request.Name.Trim();
        project.UpdatedById = updatedById;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(project).Reference(p => p.UpdatedBy).LoadAsync();
        return (ToDto(project), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return false;

        project.IsDeleted = true;
        project.DeletedById = deletedById;
        project.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<IEnumerable<ProjectExpenseSummaryDto>> GetExpenseSummaryAsync()
    {
        var expenseTotals = await _db.ProjectExpenses
            .GroupBy(e => e.ProjectId)
            .Select(g => new { ProjectId = g.Key, Total = g.Sum(e => e.TotalCost ?? 0m) })
            .ToListAsync();

        var wageTotals = await _db.ProjectWages
            .GroupBy(w => w.ProjectId)
            .Select(g => new { ProjectId = g.Key, Total = g.Sum(w => w.TotalAmount) })
            .ToListAsync();

        var transportTotals = await _db.Transportations
            .Where(t => t.ProjectId.HasValue)
            .GroupBy(t => t.ProjectId!.Value)
            .Select(g => new { ProjectId = g.Key, Total = g.Sum(t => (t.MaterialCost ?? 0m) + (t.Tax ?? 0m) + (t.Wages ?? 0m)) })
            .ToListAsync();

        var projectIds = expenseTotals.Select(e => e.ProjectId)
            .Union(wageTotals.Select(w => w.ProjectId))
            .Union(transportTotals.Select(t => t.ProjectId))
            .Distinct();

        return projectIds.Select(id =>
        {
            var exp = expenseTotals.FirstOrDefault(e => e.ProjectId == id)?.Total ?? 0m;
            var wag = wageTotals.FirstOrDefault(w => w.ProjectId == id)?.Total ?? 0m;
            var tra = transportTotals.FirstOrDefault(t => t.ProjectId == id)?.Total ?? 0m;
            return new ProjectExpenseSummaryDto
            {
                ProjectId = id,
                ExpensesTotal = exp,
                WagesTotal = wag,
                TransportationTotal = tra,
                GrandTotal = exp + wag + tra
            };
        });
    }

    private static ProjectListItemDto ToDto(Project p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        CreatedBy = p.CreatedBy?.Username,
        UpdatedBy = p.UpdatedBy?.Username,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
