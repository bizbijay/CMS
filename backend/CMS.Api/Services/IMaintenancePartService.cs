using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IMaintenancePartService
{
    Task<IEnumerable<MaintenancePartListItemDto>> GetAllAsync();
    Task<MaintenancePartListItemDto> CreateAsync(CreateMaintenancePartRequest request, int createdById);
    Task<(MaintenancePartListItemDto? Part, string? Error)> UpdateAsync(int id, UpdateMaintenancePartRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
