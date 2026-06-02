using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IMaterialService
{
    Task<IEnumerable<MaterialListItemDto>> GetAllAsync();
    Task<MaterialListItemDto?> GetByIdAsync(int id);
    Task<MaterialListItemDto> CreateAsync(CreateMaterialRequest request, int createdById);
    Task<(MaterialListItemDto? Material, string? Error)> UpdateAsync(int id, UpdateMaterialRequest request, int updatedById);
    Task<bool> DeleteAsync(int id);
}
