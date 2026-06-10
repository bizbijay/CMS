using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/salary-payments")]
public class SalaryPaymentController : ControllerBase
{
    private readonly ISalaryPaymentService _service;

    public SalaryPaymentController(ISalaryPaymentService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/salary-payments
    [HttpGet]
    [Authorize(Policy = "salary_payment.view")]
    public async Task<ActionResult<IEnumerable<SalaryPaymentListItem>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }

    // POST: api/salary-payments
    [HttpPost]
    [Authorize(Policy = "salary_payment.add")]
    public async Task<ActionResult<SalaryPaymentListItem>> Create([FromBody] CreateSalaryPaymentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var item = await _service.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetAll), null, item);
    }

    // PUT: api/salary-payments/{id}
    [HttpPut("{id:int}")]
    [Authorize(Policy = "salary_payment.edit")]
    public async Task<ActionResult<SalaryPaymentListItem>> Update(int id, [FromBody] UpdateSalaryPaymentRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (error is not null) return NotFound(new { message = error });
        return Ok(item);
    }

    // DELETE: api/salary-payments/{id}
    [HttpDelete("{id:int}")]
    [Authorize(Policy = "salary_payment.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        if (!deleted) return NotFound(new { message = "Payment record not found." });
        return NoContent();
    }
}
