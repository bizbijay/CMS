using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IProjectService
{
    Task<IEnumerable<ProjectListItemDto>> GetAllAsync();
    Task<ProjectListItemDto?> GetByIdAsync(int id);
    Task<ProjectListItemDto> CreateAsync(CreateProjectRequest request, int createdById);
    Task<(ProjectListItemDto? Project, string? Error)> UpdateAsync(int id, UpdateProjectRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
    Task<IEnumerable<ProjectExpenseSummaryDto>> GetExpenseSummaryAsync();
}
