using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface ISalaryDetailService
{
    Task<IEnumerable<SalaryDetailDto>> GetAllAsync();
    // Modifies tracked entities without saving — caller must call SaveChangesAsync.
    Task AdjustAsync(int userId, decimal totalSalaryDelta = 0, decimal paidDelta = 0);
}
