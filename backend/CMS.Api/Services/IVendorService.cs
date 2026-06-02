using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IVendorService
{
    Task<IEnumerable<VendorListItemDto>> GetAllAsync();
    Task<VendorListItemDto?> GetByIdAsync(int id);
    Task<VendorListItemDto> CreateAsync(CreateVendorRequest request, int createdById);
    Task<(VendorListItemDto? Vendor, string? Error)> UpdateAsync(int id, UpdateVendorRequest request, int updatedById);
    Task<bool> DeleteAsync(int id);
}
