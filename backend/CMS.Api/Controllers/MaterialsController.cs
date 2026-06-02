using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materials;

    public MaterialsController(IMaterialService materials)
    {
        _materials = materials;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    // GET: api/materials
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaterialListItemDto>>> GetAll()
    {
        return Ok(await _materials.GetAllAsync());
    }

    // GET: api/materials/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<MaterialListItemDto>> GetById(int id)
    {
        var material = await _materials.GetByIdAsync(id);
        return material is null ? NotFound() : Ok(material);
    }

    // POST: api/materials
    [HttpPost]
    public async Task<ActionResult<MaterialListItemDto>> Create([FromBody] CreateMaterialRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var material = await _materials.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = material.Id }, material);
    }

    // PUT: api/materials/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<MaterialListItemDto>> Update(int id, [FromBody] UpdateMaterialRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (material, error) = await _materials.UpdateAsync(id, request, CurrentUserId);
        if (material is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });

        return Ok(material);
    }

    // DELETE: api/materials/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _materials.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
