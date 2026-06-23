using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IProjectExpenseService
{
    Task<IEnumerable<ProjectExpenseListItemDto>> GetByProjectAsync(int projectId);
    Task<ProjectExpenseListItemDto?> GetByIdAsync(int id);
    Task<(ProjectExpenseListItemDto? Item, string? Error)> CreateAsync(CreateProjectExpenseRequest request, int createdById);
    Task<(ProjectExpenseListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateProjectExpenseRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
