using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IMonthlySalaryService
{
    Task<IEnumerable<MonthlySalaryRowDto>> GetForMonthAsync(int month, int year);
    Task<(MonthlySalaryRowDto? Row, string? Error)> SaveAsync(SaveMonthlySalaryRequest request, int actorId);
    Task<IEnumerable<MonthlySalaryRowDto>> VerifyAllAsync(int month, int year, int actorId);
}
