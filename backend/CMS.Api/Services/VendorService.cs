using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class VendorService : IVendorService
{
    private readonly AppDbContext _db;
    private const string EntryTypeCredit = "credit";
    private const string EntryTypeDebit = "debit";

    public VendorService(AppDbContext db) => _db = db;

    public async Task<IEnumerable<VendorListItemDto>> GetAllAsync()
    {
        var vendors = await _db.Vendors
            .Include(v => v.CreatedBy).Include(v => v.UpdatedBy)
            .OrderByDescending(v => v.CreatedAt).ToListAsync();
        return vendors.Select(ToDto);
    }

    public async Task<VendorListItemDto?> GetByIdAsync(int id)
    {
        var vendor = await _db.Vendors
            .Include(v => v.CreatedBy).Include(v => v.UpdatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);
        return vendor is null ? null : ToDto(vendor);
    }

    public async Task<IEnumerable<VendorBalanceLogListItemDto>> GetBalanceLogsAsync(int vendorId)
    {
        var items = await _db.VendorBalanceLogs
            .Include(l => l.CreatedBy)
            .Include(l => l.BankAccount)
            .Where(l => l.VendorId == vendorId)
            .OrderByDescending(l => l.LoggedOn)
            .ThenByDescending(l => l.Id)
            .ToListAsync();

        return items.Select(ToBalanceLogDto);
    }

    public async Task<VendorListItemDto> CreateAsync(CreateVendorRequest request, int createdById)
    {
        var vendor = new Vendor
        {
            Name = request.Name.Trim(),
            PanNumber = request.PanNumber?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };
        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync();
        await _db.Entry(vendor).Reference(v => v.CreatedBy).LoadAsync();
        return ToDto(vendor);
    }

    public async Task<(VendorListItemDto? Vendor, string? Error)> UpdateAsync(int id, UpdateVendorRequest request, int updatedById)
    {
        var vendor = await _db.Vendors
            .Include(v => v.CreatedBy).Include(v => v.UpdatedBy)
            .FirstOrDefaultAsync(v => v.Id == id);
        if (vendor is null) return (null, null);

        vendor.Name = request.Name.Trim();
        vendor.PanNumber = request.PanNumber?.Trim();
        vendor.UpdatedById = updatedById;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(vendor).Reference(v => v.UpdatedBy).LoadAsync();
        return (ToDto(vendor), null);
    }

    public async Task<(VendorBalanceLogListItemDto? Log, string? Error)> AddBalanceAsync(int vendorId, AddVendorBalanceRequest request, int createdById)
    {
        if (request.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == vendorId);
        if (vendor is null)
        {
            return (null, null);
        }

        var log = new VendorBalanceLog
        {
            VendorId = vendorId,
            EntryType = EntryTypeCredit,
            Amount = request.Amount,
            LoggedOn = request.LoggedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        _db.VendorBalanceLogs.Add(log);
        vendor.TotalBalance += request.Amount;
        vendor.UpdatedById = createdById;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _db.Entry(log).Reference(l => l.CreatedBy).LoadAsync();
        return (ToBalanceLogDto(log), null);
    }

    public async Task<(VendorBalanceLogListItemDto? Log, string? Error)> PayAmountAsync(int vendorId, PayVendorAmountRequest request, int createdById)
    {
        if (request.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == vendorId);
        if (vendor is null)
        {
            return (null, null);
        }

        if (vendor.TotalBalance < request.Amount)
        {
            return (null, "Payment amount cannot exceed vendor balance.");
        }

        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == request.BankAccountId && !a.IsDeleted);
        if (account is null)
        {
            return (null, "Selected bank account does not exist.");
        }

        if (account.TotalBalance < request.Amount)
        {
            return (null, "Payment amount cannot exceed selected bank account balance.");
        }

        var paidOn = request.PaidOn ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var remarks = request.Remarks?.Trim();

        await using var tx = await _db.Database.BeginTransactionAsync();

        var vendorLog = new VendorBalanceLog
        {
            VendorId = vendorId,
            BankAccountId = account.Id,
            EntryType = EntryTypeDebit,
            Amount = request.Amount,
            LoggedOn = paidOn,
            Remarks = remarks,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        var bankDebitLog = new BankAccountDebitLog
        {
            BankAccountId = account.Id,
            VendorId = vendorId,
            Amount = request.Amount,
            DebitedOn = paidOn,
            Remarks = remarks,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        _db.VendorBalanceLogs.Add(vendorLog);
        _db.BankAccountDebitLogs.Add(bankDebitLog);

        vendor.TotalBalance -= request.Amount;
        vendor.UpdatedById = createdById;
        vendor.UpdatedAt = DateTime.UtcNow;

        account.TotalBalance -= request.Amount;
        account.UpdatedById = createdById;
        account.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await tx.CommitAsync();

        await _db.Entry(vendorLog).Reference(l => l.CreatedBy).LoadAsync();
        await _db.Entry(vendorLog).Reference(l => l.BankAccount).LoadAsync();
        return (ToBalanceLogDto(vendorLog), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var vendor = await _db.Vendors.FindAsync(id);
        if (vendor is null) return false;

        vendor.IsDeleted = true;
        vendor.DeletedById = deletedById;
        vendor.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static VendorListItemDto ToDto(Vendor v) => new()
    {
        Id = v.Id,
        PanNumber = v.PanNumber,
        Name = v.Name,
        TotalBalance = v.TotalBalance,
        CreatedBy = v.CreatedBy?.Username,
        UpdatedBy = v.UpdatedBy?.Username,
        CreatedAt = v.CreatedAt,
        UpdatedAt = v.UpdatedAt
    };

    private static VendorBalanceLogListItemDto ToBalanceLogDto(VendorBalanceLog item) => new()
    {
        Id = item.Id,
        VendorId = item.VendorId,
        BankAccountId = item.BankAccountId,
        BankAccountName = item.BankAccount?.BankName,
        EntryType = item.EntryType,
        Amount = item.Amount,
        LoggedOn = item.LoggedOn,
        Remarks = item.Remarks,
        CreatedAt = item.CreatedAt,
        CreatedBy = item.CreatedBy?.Username,
    };
}
