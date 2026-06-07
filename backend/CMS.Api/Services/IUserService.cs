using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IUserService
{
    Task<IEnumerable<UserListItemDto>> GetAllAsync();
    Task<IEnumerable<UserListItemDto>> GetDozerDriversAsync();
    Task<UserListItemDto?> GetByIdAsync(int id);
    Task<(UserListItemDto? User, string? Error)> CreateAsync(CreateUserRequest request, int createdById);
    Task<(UserListItemDto? User, string? Error)> UpdateAsync(int id, UpdateUserRequest request, int updatedById);
    Task<(bool Deleted, string? Error)> DeleteAsync(int id, int currentUserId);
}
