using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class SalaryDetailService : ISalaryDetailService
{
    private readonly AppDbContext _db;

    public SalaryDetailService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<SalaryDetailDto>> GetAllAsync()
    {
        var details = await _db.SalaryDetails
            .Include(d => d.User)
            .OrderBy(d => d.User.FirstName).ThenBy(d => d.User.LastName).ThenBy(d => d.User.Username)
            .ToListAsync();

        return details.Select(d =>
        {
            var name = string.IsNullOrWhiteSpace($"{d.User.FirstName} {d.User.LastName}".Trim())
                ? d.User.Username
                : $"{d.User.FirstName} {d.User.LastName}".Trim();
            return new SalaryDetailDto
            {
                Id = d.Id,
                UserId = d.UserId,
                UserName = name,
                TotalSalary = d.TotalSalary,
                Paid = d.Paid,
                Remaining = d.Remaining
            };
        });
    }

    public async Task AdjustAsync(int userId, decimal totalSalaryDelta = 0, decimal paidDelta = 0)
    {
        // Check memory first to avoid an extra round-trip if already tracked.
        var detail = _db.SalaryDetails.Local.FirstOrDefault(d => d.UserId == userId)
                     ?? await _db.SalaryDetails.FirstOrDefaultAsync(d => d.UserId == userId);

        if (detail is null)
        {
            detail = new SalaryDetail { UserId = userId };
            _db.SalaryDetails.Add(detail);
        }

        detail.TotalSalary += totalSalaryDelta;
        detail.Paid += paidDelta;
        detail.Remaining = detail.TotalSalary - detail.Paid;
        // No SaveChangesAsync — caller is responsible for saving.
    }
}
