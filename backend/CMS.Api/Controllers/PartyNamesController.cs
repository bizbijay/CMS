using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/party-names")]
public class PartyNamesController : ControllerBase
{
    private readonly IPartyNameService _service;

    public PartyNamesController(IPartyNameService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize(Policy = "party_names.view")]
    public async Task<ActionResult<IEnumerable<PartyNameListItemDto>>> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpPost]
    [Authorize(Policy = "party_names.add")]
    public async Task<ActionResult<PartyNameListItemDto>> Create([FromBody] CreatePartyNameRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var item = await _service.CreateAsync(request, CurrentUserId);
        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "party_names.edit")]
    public async Task<ActionResult<PartyNameListItemDto>> Update(int id, [FromBody] UpdatePartyNameRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "party_names.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
