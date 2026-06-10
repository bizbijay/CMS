using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface ISalarySetupService
{
    Task<IEnumerable<SalarySetupListItemDto>> GetAllAsync();
    Task<SalarySetupListItemDto?> GetByIdAsync(int id);
    Task<(SalarySetupListItemDto? Entry, string? Error)> CreateAsync(CreateSalarySetupRequest request, int createdById);
    Task<(SalarySetupListItemDto? Entry, string? Error)> UpdateAsync(int id, UpdateSalarySetupRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
