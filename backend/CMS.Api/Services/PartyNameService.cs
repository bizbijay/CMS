using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class PartyNameService : IPartyNameService
{
    private readonly AppDbContext _db;

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

    public async Task<PartyNameListItemDto> CreateAsync(CreatePartyNameRequest request, int createdById)
    {
        var item = new PartyName
        {
            Name = request.Name.Trim(),
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
        item.UpdatedById = updatedById;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return (ToDto(item), null);
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
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };
}
