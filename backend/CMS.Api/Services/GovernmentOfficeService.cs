using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class GovernmentOfficeService : IGovernmentOfficeService
{
    private readonly AppDbContext _db;

    public GovernmentOfficeService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<GovernmentOfficeListItemDto>> GetAllAsync()
    {
        var offices = await _db.GovernmentOffices
            .Include(o => o.CreatedBy)
            .Include(o => o.UpdatedBy)
            .OrderBy(o => o.Name)
            .ToListAsync();
        return offices.Select(ToDto);
    }

    public async Task<GovernmentOfficeListItemDto?> GetByIdAsync(int id)
    {
        var office = await _db.GovernmentOffices
            .Include(o => o.CreatedBy)
            .Include(o => o.UpdatedBy)
            .FirstOrDefaultAsync(o => o.Id == id);
        return office is null ? null : ToDto(office);
    }

    public async Task<GovernmentOfficeListItemDto> CreateAsync(CreateGovernmentOfficeRequest request, int createdById)
    {
        var office = new GovernmentOffice
        {
            Name = request.Name.Trim(),
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.GovernmentOffices.Add(office);
        await _db.SaveChangesAsync();
        await _db.Entry(office).Reference(o => o.CreatedBy).LoadAsync();

        return ToDto(office);
    }

    public async Task<(GovernmentOfficeListItemDto? Office, string? Error)> UpdateAsync(int id, UpdateGovernmentOfficeRequest request, int updatedById)
    {
        var office = await _db.GovernmentOffices
            .Include(o => o.CreatedBy)
            .Include(o => o.UpdatedBy)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (office is null) return (null, null);

        office.Name = request.Name.Trim();
        office.UpdatedById = updatedById;
        office.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _db.Entry(office).Reference(o => o.UpdatedBy).LoadAsync();

        return (ToDto(office), null);
    }

    public async Task<bool> DeleteAsync(int id, int deletedById)
    {
        var office = await _db.GovernmentOffices.FindAsync(id);
        if (office is null) return false;

        office.IsDeleted = true;
        office.DeletedById = deletedById;
        office.DeletedOn = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static GovernmentOfficeListItemDto ToDto(GovernmentOffice o) => new()
    {
        Id = o.Id,
        Name = o.Name,
        CreatedBy = o.CreatedBy?.Username,
        UpdatedBy = o.UpdatedBy?.Username,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt
    };
}
