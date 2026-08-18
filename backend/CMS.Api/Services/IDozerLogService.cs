using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IDozerLogService
{
    Task<IEnumerable<DozerLogListItemDto>> GetAllAsync();
    Task<PagedResultDto<DozerLogListItemDto>> GetPagedAsync(DozerLogPagedRequest request);
    Task<IEnumerable<DozerLogListItemDto>> GetReportAsync(string? fromDate, string? toDate, string? driverName, string? vehicleName, string? projectName, string? partyName);
    Task<DozerLogListItemDto?> GetByIdAsync(int id);
    Task<(DozerLogListItemDto? Item, string? Error)> CreateAsync(CreateDozerLogRequest request, int createdById);
    Task<(DozerLogListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateDozerLogRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
