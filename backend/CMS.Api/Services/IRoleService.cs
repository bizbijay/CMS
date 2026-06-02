using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IRoleService
{
    Task<IEnumerable<RoleListItemDto>> GetAllAsync();
    Task<RoleListItemDto?> GetByIdAsync(int id);
    Task<RoleListItemDto> CreateAsync(CreateRoleRequest request, int createdById);
    Task<(RoleListItemDto? Role, string? Error)> UpdateAsync(int id, UpdateRoleRequest request, int updatedById);
    Task<bool> DeleteAsync(int id);
}
