using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IFuelLogService
{
    Task<IEnumerable<FuelLogListItemDto>> GetAllAsync();
    Task<FuelLogListItemDto?> GetByIdAsync(int id);
    Task<(FuelLogListItemDto? Item, string? Error)> CreateAsync(CreateFuelLogRequest request, int createdById);
    Task<(FuelLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateFuelLogRequest request, int updatedById);
    Task<bool> DeleteAsync(int id);
}
