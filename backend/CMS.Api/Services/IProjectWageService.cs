using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IProjectWageService
{
    Task<IEnumerable<ProjectWageListItemDto>> GetByProjectAsync(int projectId);
    Task<ProjectWageListItemDto?> GetByIdAsync(int id);
    Task<(ProjectWageListItemDto? Item, string? Error)> CreateAsync(CreateProjectWageRequest request, int createdById);
    Task<(ProjectWageListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectWageRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
