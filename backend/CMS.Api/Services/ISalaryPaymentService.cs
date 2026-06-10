using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface ISalaryPaymentService
{
    Task<IEnumerable<SalaryPaymentListItem>> GetAllAsync();
    Task<SalaryPaymentListItem> CreateAsync(CreateSalaryPaymentRequest request, int actorId);
    Task<(SalaryPaymentListItem? Item, string? Error)> UpdateAsync(int id, UpdateSalaryPaymentRequest request, int actorId);
    Task<bool> DeleteAsync(int id, int deletedById);
}
