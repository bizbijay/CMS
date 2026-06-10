using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class SalarySetupService : ISalarySetupService
{
    private readonly AppDbContext _db;

    public SalarySetupService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<SalarySetupListItemDto>> GetAllAsync()
    {
        var entries = await _db.SalarySetups
            .Include(s => s.User)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
        return entries.Select(ToDto);
    }

    public async Task<SalarySetupListItemDto?> GetByIdAsync(int id)
    {
        var entry = await _db.SalarySetups
            .Include(s => s.User)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .FirstOrDefaultAsync(s => s.Id == id);
        return entry is null ? null : ToDto(entry);
    }

    public async Task<(SalarySetupListItemDto? Entry, string? Error)> CreateAsync(CreateSalarySetupRequest request, int createdById)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists) return (null, "User not found.");

        var existing = await _db.SalarySetups.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.UserId == request.UserId);
        if (existing is not null && !existing.IsDeleted) return (null, "A salary entry already exists for this employee.");

        SalarySetup entry;
        if (existing is not null)
        {
            existing.IsDeleted = false;
            existing.DeletedById = null;
            existing.DeletedOn = null;
            existing.MonthlySalary = request.MonthlySalary;
            existing.CreatedById = createdById;
            existing.CreatedAt = DateTime.UtcNow;
            existing.UpdatedById = null;
            existing.UpdatedAt = null;
            entry = existing;
        }
        else
        {
            entry = new SalarySetup
            {
                UserId = request.UserId,
                MonthlySalary = request.MonthlySalary,
                CreatedById = createdById,
                CreatedAt = DateTime.UtcNow
            };
            _db.SalarySetups.Add(entry);
        }

        await _db.SaveChangesAsync();

        await _db.Entry(entry).Reference(s => s.User).LoadAsync();
        await _db.Entry(entry).Reference(s => s.CreatedBy).LoadAsync();

        return (ToDto(entry), null);
    }

    public async Task<(SalarySetupListItemDto? Entry, string? Error)> UpdateAsync(int id, UpdateSalarySetupRequest request, int updatedById)
    {
        var entry = await _db.SalarySetups
            .Include(s => s.User)
            .Include(s => s.CreatedBy)
            .Include(s => s.UpdatedBy)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (entry is null) return (null, null);

        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId);
        if (!userExists) return (null, "User not found.");

        var duplicate = await _db.SalarySetups.IgnoreQueryFilters()
            .FirstOrDefaultAsync(s => s.UserId == request.UserId && s.Id != id && !s.IsDeleted);
        if (duplicate is not null) return (null, "A salary entry already exists for this employee.");

        entry.UserId = request.UserId;
        entry.MonthlySalary = request.MonthlySalary;
        entry.UpdatedById = updatedById;
        entry.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(entry).Reference(s => s.User).LoadAsync();
        await _db.Entry(entry).Reference(s => s.UpdatedBy).LoadAsync();

        return (ToDto(entry), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var entry = await _db.SalarySetups.FindAsync(id);
        if (entry is null) return false;

        entry.IsDeleted = true;
        entry.DeletedById = deletedById;
        entry.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static SalarySetupListItemDto ToDto(SalarySetup s)
    {
        var name = string.IsNullOrWhiteSpace($"{s.User.FirstName} {s.User.LastName}".Trim())
            ? s.User.Username
            : $"{s.User.FirstName} {s.User.LastName}".Trim();

        return new SalarySetupListItemDto
        {
            Id = s.Id,
            UserId = s.UserId,
            UserName = name,
            MonthlySalary = s.MonthlySalary,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };
    }
}
