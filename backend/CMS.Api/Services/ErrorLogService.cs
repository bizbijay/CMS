using CMS.Api.Data;
using CMS.Api.DTOs;
using CMS.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CMS.Api.Services;

public class ErrorLogService : IErrorLogService
{
    private readonly AppDbContext _db;

    public ErrorLogService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<int> LogErrorAsync(CreateErrorLogDto dto)
    {
        var log = new ErrorLog
        {
            Message = dto.Message,
            ExceptionType = dto.ExceptionType,
            StackTrace = dto.StackTrace,
            Source = dto.Source,
            RequestPath = dto.RequestPath,
            RequestMethod = dto.RequestMethod,
            QueryString = dto.QueryString,
            StatusCode = dto.StatusCode,
            UserAgent = dto.UserAgent,
            ClientIp = dto.ClientIp,
            UserId = dto.UserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.ErrorLogs.Add(log);
        await _db.SaveChangesAsync();
        return log.Id;
    }

    public async Task<List<ErrorLogDto>> GetLogsAsync(int page = 1, int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 200) pageSize = 50;

        return await _db.ErrorLogs
            .AsNoTracking()
            .Include(e => e.User)
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new ErrorLogDto
            {
                Id = e.Id,
                Message = e.Message,
                ExceptionType = e.ExceptionType,
                StackTrace = e.StackTrace,
                Source = e.Source,
                RequestPath = e.RequestPath,
                RequestMethod = e.RequestMethod,
                QueryString = e.QueryString,
                StatusCode = e.StatusCode,
                UserAgent = e.UserAgent,
                ClientIp = e.ClientIp,
                UserId = e.UserId,
                UserName = e.User != null 
                    ? (!string.IsNullOrWhiteSpace(e.User.FirstName) ? $"{e.User.FirstName} {e.User.LastName}".Trim() : e.User.Username) 
                    : null,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ErrorLogDto?> GetLogByIdAsync(int id)
    {
        var e = await _db.ErrorLogs
            .AsNoTracking()
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (e == null) return null;

        return new ErrorLogDto
        {
            Id = e.Id,
            Message = e.Message,
            ExceptionType = e.ExceptionType,
            StackTrace = e.StackTrace,
            Source = e.Source,
            RequestPath = e.RequestPath,
            RequestMethod = e.RequestMethod,
            QueryString = e.QueryString,
            StatusCode = e.StatusCode,
            UserAgent = e.UserAgent,
            ClientIp = e.ClientIp,
            UserId = e.UserId,
            UserName = e.User != null 
                ? (!string.IsNullOrWhiteSpace(e.User.FirstName) ? $"{e.User.FirstName} {e.User.LastName}".Trim() : e.User.Username) 
                : null,
            CreatedAt = e.CreatedAt
        };
    }

    public async Task<bool> DeleteLogAsync(int id)
    {
        var log = await _db.ErrorLogs.FindAsync(id);
        if (log == null) return false;

        _db.ErrorLogs.Remove(log);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> ClearAllLogsAsync()
    {
        var count = await _db.ErrorLogs.ExecuteDeleteAsync();
        return count;
    }
}
