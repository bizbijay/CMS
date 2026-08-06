using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IVendorService
{
    Task<IEnumerable<VendorListItemDto>> GetAllAsync();
    Task<VendorListItemDto?> GetByIdAsync(int id);
    Task<IEnumerable<VendorBalanceLogListItemDto>> GetBalanceLogsAsync(int vendorId);
    Task<VendorListItemDto> CreateAsync(CreateVendorRequest request, int createdById);
    Task<(VendorListItemDto? Vendor, string? Error)> UpdateAsync(int id, UpdateVendorRequest request, int updatedById);
    Task<(VendorBalanceLogListItemDto? Log, string? Error)> AddBalanceAsync(int vendorId, AddVendorBalanceRequest request, int createdById);
    Task<(VendorBalanceLogListItemDto? Log, string? Error)> PayAmountAsync(int vendorId, PayVendorAmountRequest request, int createdById);
    Task<bool> DeleteAsync(int id, int deletedById);
}
