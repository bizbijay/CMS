using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public interface IBankAccountService
{
    Task<List<BankAccountListItemDto>> ListAsync();
    Task<BankAccountListItemDto?> GetByIdAsync(int id);
    Task<List<BankAccountBalanceSummaryDto>> ListBalancesAsync();
    Task<List<BankAccountCreditLogListItemDto>> ListCreditLogsAsync();
    Task<List<BankAccountCreditLogListItemDto>> ListCreditLogsByAccountAsync(int bankAccountId);
    Task<(BankAccountCreditLogListItemDto? Item, string? Error)> AddBalanceAsync(int bankAccountId, AddBankAccountBalanceRequest request, int createdById);
    Task<BankAccountListItemDto> CreateAsync(CreateBankAccountRequest request, int createdById);
    Task<(BankAccountListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateBankAccountRequest request, int updatedById);
    Task<bool> DeleteAsync(int id, int deletedById);
    Task<BankAccountListItemDto?> SetPrimaryAsync(int id, int updatedById);
}

public class BankAccountService : IBankAccountService
{
    private readonly AppDbContext _db;

    public BankAccountService(AppDbContext db) => _db = db;

    public async Task<List<BankAccountListItemDto>> ListAsync()
    {
        var items = await _db.BankAccounts
            .Include(a => a.CreatedBy)
            .Include(a => a.UpdatedBy)
            .Where(a => !a.IsDeleted)
            .OrderByDescending(a => a.IsPrimary)
            .ThenBy(a => a.BankName)
            .ToListAsync();

        return items.Select(ToDto).ToList();
    }

    public async Task<BankAccountListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.BankAccounts
            .Include(a => a.CreatedBy)
            .Include(a => a.UpdatedBy)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        return item is null ? null : ToDto(item);
    }

    public async Task<List<BankAccountBalanceSummaryDto>> ListBalancesAsync()
    {
        return await _db.BankAccounts
            .Where(a => !a.IsDeleted)
            .Select(a => new BankAccountBalanceSummaryDto
            {
                BankAccountId = a.Id,
                TotalBalance = a.TotalBalance
            })
            .OrderByDescending(x => x.TotalBalance)
            .ToListAsync();
    }

    public async Task<List<BankAccountCreditLogListItemDto>> ListCreditLogsAsync()
    {
        var items = await _db.BankAccountCreditLogs
            .Include(l => l.CreatedBy)
            .Include(l => l.BankAccount)
            .Where(l => !l.IsDeleted && l.BankAccount != null && !l.BankAccount.IsDeleted)
            .OrderByDescending(l => l.LoggedOn)
            .ThenByDescending(l => l.Id)
            .ToListAsync();

        return items.Select(ToCreditLogDto).ToList();
    }

    public async Task<List<BankAccountCreditLogListItemDto>> ListCreditLogsByAccountAsync(int bankAccountId)
    {
        var items = await _db.BankAccountCreditLogs
            .Include(l => l.CreatedBy)
            .Where(l => l.BankAccountId == bankAccountId && !l.IsDeleted)
            .OrderByDescending(l => l.LoggedOn)
            .ThenByDescending(l => l.Id)
            .ToListAsync();

        return items.Select(ToCreditLogDto).ToList();
    }

    public async Task<(BankAccountCreditLogListItemDto? Item, string? Error)> AddBalanceAsync(int bankAccountId, AddBankAccountBalanceRequest request, int createdById)
    {
        if (request.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == bankAccountId && !a.IsDeleted);
        if (account is null)
        {
            return (null, null);
        }

        var item = new BankAccountCreditLog
        {
            BankAccountId = bankAccountId,
            Amount = request.Amount,
            LoggedOn = request.LoggedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.BankAccountCreditLogs.Add(item);
        account.TotalBalance += request.Amount;
        account.UpdatedById = createdById;
        account.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(x => x.CreatedBy).LoadAsync();
        return (ToCreditLogDto(item), null);
    }

    public async Task<BankAccountListItemDto> CreateAsync(CreateBankAccountRequest request, int createdById)
    {
        var item = new BankAccount
        {
            BankName = request.BankName.Trim(),
            AccountHolder = request.AccountHolder.Trim(),
            AccountNumber = request.AccountNumber.Trim(),
            Branch = request.Branch?.Trim(),
            IsPrimary = request.IsPrimary,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        if (request.IsPrimary)
        {
            await ClearPrimaryFlagsAsync();
        }

        _db.BankAccounts.Add(item);
        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(a => a.CreatedBy).LoadAsync();

        return ToDto(item);
    }

    public async Task<(BankAccountListItemDto? Item, string? Error)> UpdateAsync(int id, UpdateBankAccountRequest request, int updatedById)
    {
        var item = await _db.BankAccounts
            .Include(a => a.CreatedBy)
            .Include(a => a.UpdatedBy)
            .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

        if (item is null) return (null, null);

        item.BankName = request.BankName.Trim();
        item.AccountHolder = request.AccountHolder.Trim();
        item.AccountNumber = request.AccountNumber.Trim();
        item.Branch = request.Branch?.Trim();
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        if (request.IsPrimary)
        {
            await ClearPrimaryFlagsAsync();
            item.IsPrimary = true;
        }
        else if (!await _db.BankAccounts.AnyAsync(a => a.Id != id && a.IsPrimary && !a.IsDeleted))
        {
            item.IsPrimary = false;
        }

        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(a => a.UpdatedBy).LoadAsync();

        return (ToDto(item), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (item is null) return false;

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;

        if (item.IsPrimary)
        {
            var fallback = await _db.BankAccounts
                .Where(a => a.Id != id && !a.IsDeleted)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            if (fallback is not null)
            {
                fallback.IsPrimary = true;
            }
        }

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<BankAccountListItemDto?> SetPrimaryAsync(int id, int updatedById)
    {
        var item = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
        if (item is null) return null;

        await ClearPrimaryFlagsAsync();
        item.IsPrimary = true;
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _db.Entry(item).Reference(a => a.UpdatedBy).LoadAsync();

        return ToDto(item);
    }

    private async Task ClearPrimaryFlagsAsync()
    {
        var others = await _db.BankAccounts.Where(a => !a.IsDeleted && a.IsPrimary).ToListAsync();
        foreach (var account in others)
        {
            account.IsPrimary = false;
        }
    }

    private static BankAccountListItemDto ToDto(BankAccount a) => new()
    {
        Id = a.Id,
        BankName = a.BankName,
        AccountHolder = a.AccountHolder,
        AccountNumber = a.AccountNumber,
        Branch = a.Branch,
        IsPrimary = a.IsPrimary,
        TotalBalance = a.TotalBalance,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt,
        CreatedBy = a.CreatedBy?.Username,
        UpdatedBy = a.UpdatedBy?.Username
    };

    private static BankAccountCreditLogListItemDto ToCreditLogDto(BankAccountCreditLog item) => new()
    {
        Id = item.Id,
        BankAccountId = item.BankAccountId,
        Amount = item.Amount,
        LoggedOn = item.LoggedOn,
        Remarks = item.Remarks,
        CreatedAt = item.CreatedAt,
        CreatedBy = item.CreatedBy?.Username,
    };
}
