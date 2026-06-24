using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IProjectCommissionService
{
    Task<IEnumerable<ProjectCommissionListItemDto>> GetByProjectAsync(int projectId);
    Task<ProjectCommissionListItemDto?> GetByIdAsync(int id);
    Task<(ProjectCommissionListItemDto? Item, string? Error)> CreateAsync(CreateProjectCommissionRequest request, int createdById);
    Task<(ProjectCommissionListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectCommissionRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
