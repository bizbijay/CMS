using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/extra-expenses")]
public class ExtraExpensesController : ControllerBase
{
    private readonly IExtraExpenseService _service;

    public ExtraExpensesController(IExtraExpenseService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "extra_expenses.view")]
    public async Task<ActionResult<List<ExtraExpenseListItemDto>>> List()
    {
        var items = await _service.ListAsync();
        return Ok(items);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = "extra_expenses.view")]
    public async Task<ActionResult<ExtraExpenseListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "extra_expenses.add")]
    public async Task<ActionResult<ExtraExpenseListItemDto>> Create([FromBody] CreateExtraExpenseRequest request)
    {
        var (item, error) = await _service.CreateAsync(request, CurrentUserId);
        if (error is not null) return BadRequest(new { message = error });
        return CreatedAtAction(nameof(GetById), new { id = item!.Id }, item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "extra_expenses.edit")]
    public async Task<ActionResult<ExtraExpenseListItemDto>> Update(int id, [FromBody] UpdateExtraExpenseRequest request)
    {
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (error is not null) return BadRequest(new { message = error });
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpPost("{id:int}/verify")]
    [Authorize(Policy = "extra_expenses.verify")]
    public async Task<ActionResult<ExtraExpenseListItemDto>> Verify(int id)
    {
        var (item, error) = await _service.VerifyAsync(id, CurrentUserId);
        if (error is not null) return BadRequest(new { message = error });
        if (item is null) return NotFound();
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "extra_expenses.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id, CurrentUserId);
        if (!success) return NotFound();
        return NoContent();
    }
}
