using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IVehicleService
{
    Task<IEnumerable<VehicleListItemDto>> GetAllAsync();
    Task<VehicleListItemDto?> GetByIdAsync(int id);
    Task<(VehicleListItemDto? Vehicle, string? Error)> CreateAsync(CreateVehicleRequest request, int createdById);
    Task<(VehicleListItemDto? Vehicle, string? Error)> UpdateAsync(int id, UpdateVehicleRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
