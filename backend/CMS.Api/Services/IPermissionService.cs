using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IPermissionService
{
    Task<IEnumerable<PermissionListItemDto>> GetAllAsync();
    Task<PermissionListItemDto?> GetByIdAsync(int id);
    Task<PermissionListItemDto> CreateAsync(CreatePermissionRequest request, int createdById);
    Task<(PermissionListItemDto? Permission, string? Error)> UpdateAsync(int id, UpdatePermissionRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
