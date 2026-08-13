using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class PartyNameService : IPartyNameService
{
    private readonly AppDbContext _db;
    private const string EntryTypeCredit = "credit";
    private const string EntryTypeDebit = "debit";

    public PartyNameService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<PartyNameListItemDto>> GetAllAsync()
    {
        var items = await _db.PartyNames
            .OrderBy(p => p.Name)
            .ToListAsync();

        return items.Select(ToDto);
    }

    public async Task<IEnumerable<PartyNameListItemDto>> GetDropdownAsync()
    {
        var items = await _db.PartyNames
            .OrderBy(p => p.Name)
            .ToListAsync();

        return items.Select(ToDto);
    }

    public async Task<PartyNameListItemDto?> GetByIdAsync(int id)
    {
        var item = await _db.PartyNames.FirstOrDefaultAsync(p => p.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<IEnumerable<PartyBalanceLogListItemDto>> GetBalanceLogsAsync(int partyNameId)
    {
        var items = await _db.PartyBalanceLogs
            .Include(l => l.CreatedBy)
            .Where(l => l.PartyNameId == partyNameId)
            .OrderByDescending(l => l.LoggedOn)
            .ThenByDescending(l => l.Id)
            .ToListAsync();

        return items.Select(ToBalanceLogDto);
    }

    public async Task<PartyNameListItemDto> CreateAsync(CreatePartyNameRequest request, int createdById)
    {
        var item = new PartyName
        {
            Name = request.Name.Trim(),
            Type = NormalizeType(request.Type),
            Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.PartyNames.Add(item);
        await _db.SaveChangesAsync();
        return ToDto(item);
    }

    public async Task<(PartyNameListItemDto? PartyName, string? Error)> UpdateAsync(int id, UpdatePartyNameRequest request, int updatedById)
    {
        var item = await _db.PartyNames.FindAsync(id);
        if (item is null) return (null, null);

        item.Name = request.Name.Trim();
        item.Type = NormalizeType(request.Type);
        item.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (ToDto(item), null);
    }

    public async Task<(PartyBalanceLogListItemDto? Log, string? Error)> AddBalanceAsync(int partyNameId, AddPartyBalanceRequest request, int createdById)
    {
        if (request.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        var item = await _db.PartyNames.FirstOrDefaultAsync(p => p.Id == partyNameId);
        if (item is null)
        {
            return (null, null);
        }

        var log = new PartyBalanceLog
        {
            PartyNameId = partyNameId,
            EntryType = EntryTypeCredit,
            Amount = request.Amount,
            LoggedOn = request.LoggedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        _db.PartyBalanceLogs.Add(log);
        item.TotalBalance += request.Amount;
        item.UpdatedById = createdById;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(log).Reference(x => x.CreatedBy).LoadAsync();

        return (ToBalanceLogDto(log), null);
    }

    public async Task<(PartyBalanceLogListItemDto? Log, string? Error)> ReceiveAmountAsync(int partyNameId, ReceivePartyAmountRequest request, int createdById)
    {
        if (request.Amount <= 0)
        {
            return (null, "Amount must be greater than zero.");
        }

        var item = await _db.PartyNames.FirstOrDefaultAsync(p => p.Id == partyNameId);
        if (item is null)
        {
            return (null, null);
        }

        if (item.TotalBalance < request.Amount)
        {
            return (null, "Receive amount cannot exceed party balance.");
        }

        var log = new PartyBalanceLog
        {
            PartyNameId = partyNameId,
            EntryType = EntryTypeDebit,
            Amount = request.Amount,
            LoggedOn = request.ReceivedOn ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Remarks = request.Remarks?.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow,
        };

        _db.PartyBalanceLogs.Add(log);
        item.TotalBalance -= request.Amount;
        item.UpdatedById = createdById;
        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(log).Reference(x => x.CreatedBy).LoadAsync();

        return (ToBalanceLogDto(log), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var item = await _db.PartyNames.FindAsync(id);
        if (item is null) return false;

        item.IsDeleted = true;
        item.DeletedById = deletedById;
        item.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static PartyNameListItemDto ToDto(PartyName p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Type = p.Type,
        Address = p.Address,
        TotalBalance = p.TotalBalance,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    private static string NormalizeType(string? type)
    {
        if (string.IsNullOrWhiteSpace(type)) return "other";
        var normalized = type.Trim().ToLowerInvariant().Replace(" ", "_");
        return normalized is "petrol_pump" or "petrolpump" ? "petrol_pump" : "other";
    }

    private static PartyBalanceLogListItemDto ToBalanceLogDto(PartyBalanceLog item) => new()
    {
        Id = item.Id,
        PartyNameId = item.PartyNameId,
        EntryType = item.EntryType,
        Amount = item.Amount,
        LoggedOn = item.LoggedOn,
        Remarks = item.Remarks,
        CreatedAt = item.CreatedAt,
        CreatedBy = item.CreatedBy?.Username,
    };
}
