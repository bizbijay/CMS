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

    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _db.Projects.FindAsync(id);
        if (project is null) return false;
        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();
        return true;
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
