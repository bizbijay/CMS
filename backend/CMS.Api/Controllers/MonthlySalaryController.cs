using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/monthly-salary")]
public class MonthlySalaryController : ControllerBase
{
    private readonly IMonthlySalaryService _service;

    public MonthlySalaryController(IMonthlySalaryService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/monthly-salary?month=6&year=2025
    [HttpGet]
    [Authorize(Policy = "monthly_salary.view")]
    public async Task<ActionResult<IEnumerable<MonthlySalaryRowDto>>> GetForMonth([FromQuery] int month, [FromQuery] int year)
    {
        if (month < 1 || month > 12) return BadRequest(new { message = "Month must be between 1 and 12." });
        if (year < 2000 || year > 2100) return BadRequest(new { message = "Year is out of range." });

        return Ok(await _service.GetForMonthAsync(month, year));
    }

    // POST: api/monthly-salary/verify-all
    [HttpPost("verify-all")]
    [Authorize(Policy = "monthly_salary.edit")]
    public async Task<ActionResult<IEnumerable<MonthlySalaryRowDto>>> VerifyAll([FromBody] VerifyAllRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var rows = await _service.VerifyAllAsync(request.Month, request.Year, CurrentUserId);
        return Ok(rows);
    }

    // POST: api/monthly-salary
    [HttpPost]
    [Authorize(Policy = "monthly_salary.edit")]
    public async Task<ActionResult<MonthlySalaryRowDto>> Save([FromBody] SaveMonthlySalaryRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (row, error) = await _service.SaveAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });

        return Ok(row);
    }
}
