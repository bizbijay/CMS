using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IDozerLogService
{
    Task<IEnumerable<DozerLogListItemDto>> GetAllAsync();
    Task<DozerLogListItemDto?> GetByIdAsync(int id);
    Task<(DozerLogListItemDto? Item, string? Error)> CreateAsync(CreateDozerLogRequest request, int createdById);
    Task<(DozerLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateDozerLogRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
