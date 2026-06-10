using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class MonthlySalaryService : IMonthlySalaryService
{
    private readonly AppDbContext _db;
    private readonly ISalaryDetailService _salaryDetailService;

    public MonthlySalaryService(AppDbContext db, ISalaryDetailService salaryDetailService)
    {
        _db = db;
        _salaryDetailService = salaryDetailService;
    }

    public async Task<IEnumerable<MonthlySalaryRowDto>> GetForMonthAsync(int month, int year)
    {
        var setups = await _db.SalarySetups
            .Include(s => s.User)
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.LastName).ThenBy(s => s.User.Username)
            .ToListAsync();

        var records = await _db.MonthlySalaries
            .Where(m => m.Month == month && m.Year == year)
            .ToListAsync();

        var recordMap = records.ToDictionary(m => m.UserId);

        return setups.Select(ss =>
        {
            var name = BuildName(ss.User);
            recordMap.TryGetValue(ss.UserId, out var rec);
            return new MonthlySalaryRowDto
            {
                Id = rec?.Id,
                UserId = ss.UserId,
                UserName = name,
                DefaultSalary = ss.MonthlySalary,
                Amount = rec?.Amount ?? ss.MonthlySalary,
                IsVerified = rec?.IsVerified ?? false,
                Month = month,
                Year = year
            };
        });
    }

    public async Task<(MonthlySalaryRowDto? Row, string? Error)> SaveAsync(SaveMonthlySalaryRequest request, int actorId)
    {
        var setup = await _db.SalarySetups
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == request.UserId);

        if (setup is null) return (null, "No salary setup found for this employee.");

        var existing = await _db.MonthlySalaries
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(m => m.UserId == request.UserId && m.Month == request.Month && m.Year == request.Year);

        decimal totalSalaryDelta;
        if (existing is null || existing.IsDeleted)
        {
            totalSalaryDelta = request.Amount;
            if (existing is null)
            {
                existing = new MonthlySalary
                {
                    UserId = request.UserId,
                    Month = request.Month,
                    Year = request.Year,
                    Amount = request.Amount,
                    IsVerified = request.IsVerified,
                    CreatedById = actorId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.MonthlySalaries.Add(existing);
            }
            else
            {
                existing.IsDeleted = false;
                existing.DeletedById = null;
                existing.DeletedOn = null;
                existing.Amount = request.Amount;
                existing.IsVerified = request.IsVerified;
                existing.CreatedById = actorId;
                existing.CreatedAt = DateTime.UtcNow;
                existing.UpdatedById = null;
                existing.UpdatedAt = null;
            }
        }
        else
        {
            totalSalaryDelta = request.Amount - existing.Amount;
            existing.Amount = request.Amount;
            existing.IsVerified = request.IsVerified;
            existing.UpdatedById = actorId;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _salaryDetailService.AdjustAsync(request.UserId, totalSalaryDelta: totalSalaryDelta);
        await _db.SaveChangesAsync();

        return (new MonthlySalaryRowDto
        {
            Id = existing.Id,
            UserId = existing.UserId,
            UserName = BuildName(setup.User),
            DefaultSalary = setup.MonthlySalary,
            Amount = existing.Amount,
            IsVerified = existing.IsVerified,
            Month = existing.Month,
            Year = existing.Year
        }, null);
    }

    public async Task<IEnumerable<MonthlySalaryRowDto>> VerifyAllAsync(int month, int year, int actorId)
    {
        var setups = await _db.SalarySetups
            .Include(s => s.User)
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.LastName).ThenBy(s => s.User.Username)
            .ToListAsync();

        var records = await _db.MonthlySalaries
            .IgnoreQueryFilters()
            .Where(m => m.Month == month && m.Year == year)
            .ToListAsync();

        var recordMap = records.ToDictionary(m => m.UserId);

        foreach (var ss in setups)
        {
            if (recordMap.TryGetValue(ss.UserId, out var existing) && !existing.IsDeleted)
            {
                existing.IsVerified = true;
                existing.UpdatedById = actorId;
                existing.UpdatedAt = DateTime.UtcNow;
                // Existing record: amount unchanged, so no SalaryDetail adjustment needed.
            }
            else if (recordMap.TryGetValue(ss.UserId, out var deleted) && deleted.IsDeleted)
            {
                deleted.IsDeleted = false;
                deleted.DeletedById = null;
                deleted.DeletedOn = null;
                deleted.Amount = ss.MonthlySalary;
                deleted.IsVerified = true;
                deleted.CreatedById = actorId;
                deleted.CreatedAt = DateTime.UtcNow;
                deleted.UpdatedById = null;
                deleted.UpdatedAt = null;
                recordMap[ss.UserId] = deleted;
                await _salaryDetailService.AdjustAsync(ss.UserId, totalSalaryDelta: ss.MonthlySalary);
            }
            else
            {
                var newRecord = new MonthlySalary
                {
                    UserId = ss.UserId,
                    Month = month,
                    Year = year,
                    Amount = ss.MonthlySalary,
                    IsVerified = true,
                    CreatedById = actorId,
                    CreatedAt = DateTime.UtcNow
                };
                _db.MonthlySalaries.Add(newRecord);
                recordMap[ss.UserId] = newRecord;
                await _salaryDetailService.AdjustAsync(ss.UserId, totalSalaryDelta: ss.MonthlySalary);
            }
        }

        await _db.SaveChangesAsync();

        return setups.Select(ss =>
        {
            var rec = recordMap[ss.UserId];
            return new MonthlySalaryRowDto
            {
                Id = rec.Id,
                UserId = ss.UserId,
                UserName = BuildName(ss.User),
                DefaultSalary = ss.MonthlySalary,
                Amount = rec.Amount,
                IsVerified = true,
                Month = month,
                Year = year
            };
        });
    }

    private static string BuildName(User u) =>
        string.IsNullOrWhiteSpace($"{u.FirstName} {u.LastName}".Trim())
            ? u.Username
            : $"{u.FirstName} {u.LastName}".Trim();
}
