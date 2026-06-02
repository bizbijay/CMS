using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<UserListItemDto>> GetAllAsync()
    {
        var users = await _db.Users
            .Include(u => u.AssignedVehicle)
            .Include(u => u.CreatedBy)
            .Include(u => u.UpdatedBy)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
        return users.Select(ToDto);
    }

    public async Task<UserListItemDto?> GetByIdAsync(int id)
    {
        var user = await _db.Users
            .Include(u => u.AssignedVehicle)
            .Include(u => u.CreatedBy)
            .Include(u => u.UpdatedBy)
            .FirstOrDefaultAsync(u => u.Id == id);
        return user is null ? null : ToDto(user);
    }

    public async Task<(UserListItemDto? User, string? Error)> CreateAsync(CreateUserRequest request, int createdById)
    {
        var pwErrors = PasswordPolicy.Validate(request.Password);
        if (pwErrors.Count > 0)
            return (null, PasswordPolicy.BuildErrorMessage(pwErrors));

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users.AnyAsync(u => u.Username == username || u.Email == email);
        if (exists)
            return (null, "A user with that username or email already exists.");

        var vehicleId = request.Type == UserType.Driver ? request.VehicleId : null;
        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
            return (null, "Selected vehicle does not exist.");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            IsActive = request.IsActive,
            Type = request.Type,
            VehicleId = vehicleId,
            CreatedById = createdById,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _db.Entry(user).Reference(u => u.AssignedVehicle).LoadAsync();
        await _db.Entry(user).Reference(u => u.CreatedBy).LoadAsync();

        return (ToDto(user), null);
    }

    public async Task<(UserListItemDto? User, string? Error)> UpdateAsync(int id, UpdateUserRequest request, int updatedById)
    {
        var user = await _db.Users
            .Include(u => u.AssignedVehicle)
            .Include(u => u.CreatedBy)
            .Include(u => u.UpdatedBy)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return (null, null);

        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        var conflict = await _db.Users.AnyAsync(u => u.Id != id && (u.Username == username || u.Email == email));
        if (conflict)
            return (null, "Another user already has that username or email.");

        var vehicleId = request.Type == UserType.Driver ? request.VehicleId : null;
        if (vehicleId.HasValue && !await _db.Vehicles.AnyAsync(v => v.Id == vehicleId.Value))
            return (null, "Selected vehicle does not exist.");

        user.Username = username;
        user.Email = email;
        user.FirstName = request.FirstName?.Trim();
        user.LastName = request.LastName?.Trim();
        user.IsActive = request.IsActive;
        user.Type = request.Type;
        user.VehicleId = vehicleId;
        user.UpdatedById = updatedById;
        user.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var pwErrors = PasswordPolicy.Validate(request.Password);
            if (pwErrors.Count > 0)
                return (null, PasswordPolicy.BuildErrorMessage(pwErrors));

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _db.SaveChangesAsync();

        await _db.Entry(user).Reference(u => u.AssignedVehicle).LoadAsync();
        await _db.Entry(user).Reference(u => u.UpdatedBy).LoadAsync();

        return (ToDto(user), null);
    }

    public async Task<(bool Deleted, string? Error)> DeleteAsync(int id, int currentUserId)
    {
        if (currentUserId == id)
            return (false, "You cannot delete your own account.");

        var user = await _db.Users.FindAsync(id);
        if (user is null) return (false, null);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return (true, null);
    }

    private static UserListItemDto ToDto(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        Email = u.Email,
        FirstName = u.FirstName,
        LastName = u.LastName,
        IsActive = u.IsActive,
        Type = u.Type,
        VehicleId = u.VehicleId,
        AssignedVehicleName = u.AssignedVehicle is null ? null
            : $"{u.AssignedVehicle.Name} ({u.AssignedVehicle.NumberPlate})",
        CreatedBy = u.CreatedBy?.Username,
        UpdatedBy = u.UpdatedBy?.Username,
        CreatedAt = u.CreatedAt,
        LastLoginAt = u.LastLoginAt
    };
}
