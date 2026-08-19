using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/error-logs")]
[Authorize]
public class ErrorLogsController : ControllerBase
{
    private readonly IErrorLogService _service;

    public ErrorLogsController(IErrorLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<ErrorLogDto>>> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var logs = await _service.GetLogsAsync(page, pageSize);
        return Ok(logs);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ErrorLogDto>> GetLogById(int id)
    {
        var log = await _service.GetLogByIdAsync(id);
        if (log is null) return NotFound();
        return Ok(log);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteLog(int id)
    {
        var success = await _service.DeleteLogAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpDelete("clear-all")]
    public async Task<ActionResult<object>> ClearAllLogs()
    {
        var count = await _service.ClearAllLogsAsync();
        return Ok(new { clearedCount = count });
    }
}
