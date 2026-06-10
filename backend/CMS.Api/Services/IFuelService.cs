using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IFuelService
{
    Task<IEnumerable<FuelListItemDto>> GetAllAsync();
    Task<FuelListItemDto?> GetByIdAsync(int id);
    Task<FuelListItemDto> CreateAsync(CreateFuelRequest request, int createdById);
    Task<(FuelListItemDto? Fuel, string? Error)> UpdateAsync(int id, UpdateFuelRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
