using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IVehicleMaintenanceLogService
{
    Task<IEnumerable<VehicleMaintenanceLogListItemDto>> GetByVehicleAsync(int vehicleId);
    Task<VehicleMaintenanceLogListItemDto?> GetByIdAsync(int id);
    Task<(VehicleMaintenanceLogListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenanceLogRequest request, int createdById);
    Task<(VehicleMaintenanceLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenanceLogRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}

public interface IVehicleMaintenancePartService
{
    Task<IEnumerable<VehicleMaintenancePartListItemDto>> GetByLogAsync(int logId);
    Task<(VehicleMaintenancePartListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenancePartRequest request, int createdById);
    Task<(VehicleMaintenancePartListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenancePartRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}

public interface IVehicleMaintenanceWageService
{
    Task<IEnumerable<VehicleMaintenanceWageListItemDto>> GetByLogAsync(int logId);
    Task<(VehicleMaintenanceWageListItemDto? Item, string? Error)> CreateAsync(CreateVehicleMaintenanceWageRequest request, int createdById);
    Task<(VehicleMaintenanceWageListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateVehicleMaintenanceWageRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
