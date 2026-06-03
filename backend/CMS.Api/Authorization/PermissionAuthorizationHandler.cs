using CMS.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace CMS.Api.Authorization;

// Registered as singleton — uses IServiceScopeFactory to resolve the scoped AppDbContext.
public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryCache _cache;

    public PermissionAuthorizationHandler(IServiceScopeFactory scopeFactory, IMemoryCache cache)
    {
        _scopeFactory = scopeFactory;
        _cache = cache;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var idClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idClaim, out var userId))
            return; // leave unsatisfied → 403

        var cacheKey = $"user-perms:{userId}";
        if (!_cache.TryGetValue(cacheKey, out HashSet<string>? permissions))
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var roleId = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.IsActive)
                .Select(u => u.RoleId)
                .FirstOrDefaultAsync();

            if (roleId is null)
            {
                permissions = [];
            }
            else
            {
                var names = await db.RolePermissions
                    .Where(rp => rp.RoleId == roleId)
                    .Join(db.Permissions,
                          rp => rp.PermissionId,
                          p => p.Id,
                          (rp, p) => p.Name)
                    .ToListAsync();

                permissions = new HashSet<string>(names, StringComparer.OrdinalIgnoreCase);
            }

            _cache.Set(cacheKey, permissions, new MemoryCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromMinutes(5)
            });
        }

        if (permissions!.Contains(requirement.Permission))
            context.Succeed(requirement);
    }
}
