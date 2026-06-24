using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IGovernmentOfficeService
{
    Task<IEnumerable<GovernmentOfficeListItemDto>> GetAllAsync();
    Task<GovernmentOfficeListItemDto?> GetByIdAsync(int id);
    Task<GovernmentOfficeListItemDto> CreateAsync(CreateGovernmentOfficeRequest request, int createdById);
    Task<(GovernmentOfficeListItemDto? Office, string? Error)> UpdateAsync(int id, UpdateGovernmentOfficeRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
