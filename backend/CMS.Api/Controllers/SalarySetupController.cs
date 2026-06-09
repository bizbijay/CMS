using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/salary-setup")]
public class SalarySetupController : ControllerBase
{
    private readonly ISalarySetupService _salarySetup;

    public SalarySetupController(ISalarySetupService salarySetup)
    {
        _salarySetup = salarySetup;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/salary-setup
    [HttpGet]
    [Authorize(Policy = "salary_setup.view")]
    public async Task<ActionResult<IEnumerable<SalarySetupListItemDto>>> GetAll()
    {
        return Ok(await _salarySetup.GetAllAsync());
    }

    // GET: api/salary-setup/5
    [HttpGet("{id:int}")]
    [Authorize(Policy = "salary_setup.view")]
    public async Task<ActionResult<SalarySetupListItemDto>> GetById(int id)
    {
        var entry = await _salarySetup.GetByIdAsync(id);
        return entry is null ? NotFound() : Ok(entry);
    }

    // POST: api/salary-setup
    [HttpPost]
    [Authorize(Policy = "salary_setup.add")]
    public async Task<ActionResult<SalarySetupListItemDto>> Create([FromBody] CreateSalarySetupRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (entry, error) = await _salarySetup.CreateAsync(request, CurrentUserId);
        if (error is not null) return Conflict(new { message = error });

        return CreatedAtAction(nameof(GetById), new { id = entry!.Id }, entry);
    }

    // PUT: api/salary-setup/5
    [HttpPut("{id:int}")]
    [Authorize(Policy = "salary_setup.edit")]
    public async Task<ActionResult<SalarySetupListItemDto>> Update(int id, [FromBody] UpdateSalarySetupRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (entry, error) = await _salarySetup.UpdateAsync(id, request, CurrentUserId);
        if (entry is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });

        return Ok(entry);
    }

    // DELETE: api/salary-setup/5
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "salary_setup.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _salarySetup.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
