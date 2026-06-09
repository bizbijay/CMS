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

    public async Task<SalaryBreakdownDto?> GetBreakdownAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user is null) return null;

        var userName = string.IsNullOrWhiteSpace($"{user.FirstName} {user.LastName}".Trim())
            ? user.Username
            : $"{user.FirstName} {user.LastName}".Trim();

        var monthlySalaries = await _db.MonthlySalaries
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Year).ThenByDescending(m => m.Month)
            .Select(m => new MonthlySalaryBreakdownItem
            {
                Month = m.Month,
                Year = m.Year,
                Amount = m.Amount,
                IsVerified = m.IsVerified
            })
            .ToListAsync();

        var transportationWages = await _db.Transportations
            .Where(t => t.TransportedById == userId && t.Wages != null && t.Wages > 0)
            .Include(t => t.Project)
            .Include(t => t.Vendor)
            .OrderByDescending(t => t.Date)
            .Select(t => new WageBreakdownItem
            {
                TransportationId = t.Id,
                Date = t.Date,
                Wages = t.Wages!.Value,
                ProjectName = t.Project != null ? t.Project.Name : t.ProjectOther,
                VendorName = t.Vendor != null ? t.Vendor.Name : t.VendorOther
            })
            .ToListAsync();

        var dozerWages = await _db.DozerLogs
            .Where(d => d.DriverId == userId && d.Wages != null && d.Wages > 0)
            .Include(d => d.Project)
            .OrderByDescending(d => d.OperationDate)
            .Select(d => new WageBreakdownItem
            {
                TransportationId = d.Id,
                Date = d.OperationDate,
                Wages = d.Wages!.Value,
                ProjectName = d.Project != null ? d.Project.Name : d.ProjectOther,
                VendorName = null,
                OperatedTimeMs = d.OperatedTimeMs
            })
            .ToListAsync();

        var wages = transportationWages
            .Concat(dozerWages)
            .OrderByDescending(w => w.Date)
            .ToList();

        var totalFromMonthly = monthlySalaries.Sum(m => m.Amount);
        var totalFromWages = wages.Sum(w => w.Wages);

        return new SalaryBreakdownDto
        {
            UserId = userId,
            UserName = userName,
            TotalFromMonthlySalaries = totalFromMonthly,
            TotalFromWages = totalFromWages,
            GrandTotal = totalFromMonthly + totalFromWages,
            MonthlySalaries = monthlySalaries,
            Wages = wages
        };
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
