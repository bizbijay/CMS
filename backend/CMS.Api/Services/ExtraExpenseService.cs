using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public interface IExtraExpenseService
{
    Task<List<ExtraExpenseListItemDto>> ListAsync();
    Task<ExtraExpenseListItemDto?> GetByIdAsync(int id);
    Task<(ExtraExpenseListItemDto? Item, string? Error)> CreateAsync(CreateExtraExpenseRequest request, int createdById);
    Task<(ExtraExpenseListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateExtraExpenseRequest request, int updatedById);
    Task<(ExtraExpenseListItemDto? Item, string? Error)> VerifyAsync(int id, int verifiedById);
    Task<bool> DeleteAsync(int id, int deletedById);
}

public class ExtraExpenseService : IExtraExpenseService
{
    private readonly AppDbContext _db;

    public ExtraExpenseService(AppDbContext db) => _db = db;

    public async Task<List<ExtraExpenseListItemDto>> ListAsync()
    {
        var items = await _db.ExtraExpenses
            .Include(e => e.ExpensedBy)
            .Include(e => e.VerifiedBy)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .Where(e => !e.IsDeleted)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return items.Select(ToDto).ToList();
    }

    public async Task<ExtraExpenseListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.ExtraExpenses
            .Include(e => e.ExpensedBy)
            .Include(e => e.VerifiedBy)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        return item is null ? null : ToDto(item);
    }

    public async Task<(ExtraExpenseListItemDto? Item, string? Error)> CreateAsync(CreateExtraExpenseRequest request, int createdById)
    {
        if (string.IsNullOrWhiteSpace(request.Item))
            return (null, "Item name/description is required.");

        var item = new ExtraExpense
        {
            ExpensedById = request.ExpensedById,
            ExpensedByOther = request.ExpensedById is null ? request.ExpensedByOther?.Trim() : null,
            Item = request.Item.Trim(),
            Quantity = request.Quantity,
            Cost = request.Cost,
            TotalCost = request.TotalCost,
            Remarks = request.Remarks?.Trim(),
            IsVerified = false, // When added, isverified is false by default
            Date = request.Date,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.ExtraExpenses.Add(item);
        await _db.SaveChangesAsync();

        if (item.ExpensedById.HasValue) await _db.Entry(item).Reference(e => e.ExpensedBy).LoadAsync();
        await _db.Entry(item).Reference(e => e.CreatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(ExtraExpenseListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateExtraExpenseRequest request, int updatedById)
    {
        var item = await _db.ExtraExpenses
            .Include(e => e.ExpensedBy)
            .Include(e => e.VerifiedBy)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (item is null) return (null, null);

        if (string.IsNullOrWhiteSpace(request.Item))
            return (null, "Item name/description is required.");

        item.ExpensedById = request.ExpensedById;
        item.ExpensedByOther = request.ExpensedById is null ? request.ExpensedByOther?.Trim() : null;
        item.Item = request.Item.Trim();
        item.Quantity = request.Quantity;
        item.Cost = request.Cost;
        item.TotalCost = request.TotalCost;
        item.Remarks = request.Remarks?.Trim();
        item.Date = request.Date;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (item.ExpensedById.HasValue) await _db.Entry(item).Reference(e => e.ExpensedBy).LoadAsync();
        await _db.Entry(item).Reference(e => e.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<(ExtraExpenseListItemDto? Item, string? Error)> VerifyAsync(int id, int verifiedById)
    {
        var item = await _db.ExtraExpenses
            .Include(e => e.ExpensedBy)
            .Include(e => e.VerifiedBy)
            .Include(e => e.CreatedBy)
            .Include(e => e.UpdatedBy)
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);

        if (item is null) return (null, null);

        item.IsVerified = true;
        item.VerifiedById = verifiedById;
        item.VerifiedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(e => e.VerifiedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.ExtraExpenses.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        if (item is null) return false;

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    private static ExtraExpenseListItemDto ToDto(ExtraExpense e) => new()
    {
        Id = e.Id,
        ExpensedById = e.ExpensedById,
        ExpensedByName = e.ExpensedBy != null
            ? string.Join(" ", new[] { e.ExpensedBy.FirstName, e.ExpensedBy.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim() is { Length: > 0 } fullName ? fullName : e.ExpensedBy.Username
            : e.ExpensedByOther ?? string.Empty,
        ExpensedByOther = e.ExpensedByOther,
        Item = e.Item,
        Quantity = e.Quantity,
        Cost = e.Cost,
        TotalCost = e.TotalCost,
        Remarks = e.Remarks,
        IsVerified = e.IsVerified,
        VerifiedById = e.VerifiedById,
        VerifiedByName = e.VerifiedBy != null
            ? string.Join(" ", new[] { e.VerifiedBy.FirstName, e.VerifiedBy.LastName }.Where(s => !string.IsNullOrWhiteSpace(s))).Trim() is { Length: > 0 } vName ? vName : e.VerifiedBy.Username
            : null,
        VerifiedAt = e.VerifiedAt,
        Date = e.Date,
        CreatedById = e.CreatedById,
        CreatedBy = e.CreatedBy?.Username,
        UpdatedBy = e.UpdatedBy?.Username,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt
    };
}
