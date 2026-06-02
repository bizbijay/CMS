using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class VendorService : IVendorService
{
    private readonly AppDbContext _db;
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

    public async Task<VendorListItemDto> CreateAsync(CreateVendorRequest request, int createdById)
    {
        var vendor = new Vendor
        {
            Name = request.Name.Trim(),
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
        vendor.UpdatedById = updatedById;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(vendor).Reference(v => v.UpdatedBy).LoadAsync();
        return (ToDto(vendor), null);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var vendor = await _db.Vendors.FindAsync(id);
        if (vendor is null) return false;
        _db.Vendors.Remove(vendor);
        await _db.SaveChangesAsync();
        return true;
    }

    private static VendorListItemDto ToDto(Vendor v) => new()
    {
        Id = v.Id,
        Name = v.Name,
        CreatedBy = v.CreatedBy?.Username,
        UpdatedBy = v.UpdatedBy?.Username,
        CreatedAt = v.CreatedAt,
        UpdatedAt = v.UpdatedAt
    };
}
