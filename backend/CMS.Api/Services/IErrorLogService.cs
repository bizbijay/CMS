using CMS.Api.DTOs;

namespace CMS.Api.Services;

public interface IErrorLogService
{
    Task<int> LogErrorAsync(CreateErrorLogDto dto);
    Task<List<ErrorLogDto>> GetLogsAsync(int page = 1, int pageSize = 50);
    Task<ErrorLogDto?> GetLogByIdAsync(int id);
    Task<bool> DeleteLogAsync(int id);
    Task<int> ClearAllLogsAsync();
}
