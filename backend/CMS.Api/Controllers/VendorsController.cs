using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendorsController : ControllerBase
{
    private readonly IVendorService _vendors;
    public VendorsController(IVendorService vendors) => _vendors = vendors;

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<VendorListItemDto>>> GetAll() =>
        Ok(await _vendors.GetAllAsync());

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<VendorListItemDto>> GetById(int id)
    {
        var vendor = await _vendors.GetByIdAsync(id);
        return vendor is null ? NotFound() : Ok(vendor);
    }

    [HttpPost]
    [Authorize(Policy = "vendors.add")]
    public async Task<ActionResult<VendorListItemDto>> Create([FromBody] CreateVendorRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var vendor = await _vendors.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = vendor.Id }, vendor);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "vendors.edit")]
    public async Task<ActionResult<VendorListItemDto>> Update(int id, [FromBody] UpdateVendorRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (vendor, error) = await _vendors.UpdateAsync(id, request, CurrentUserId);
        if (vendor is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(vendor);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "vendors.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _vendors.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
