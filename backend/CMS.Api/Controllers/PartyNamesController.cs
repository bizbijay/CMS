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

    [HttpGet("{id:int}")]
    [Authorize(Policy = "party_names.view")]
    public async Task<ActionResult<PartyNameListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}/balance-logs")]
    [Authorize(Policy = "party_names.view")]
    public async Task<ActionResult<IEnumerable<PartyBalanceLogListItemDto>>> GetBalanceLogs(int id)
    {
        var item = await _service.GetByIdAsync(id);
        if (item is null) return NotFound();

        return Ok(await _service.GetBalanceLogsAsync(id));
    }

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

    [HttpPost("{id:int}/credit")]
    [Authorize(Policy = "party_names.edit")]
    public async Task<ActionResult<PartyBalanceLogListItemDto>> AddBalance(int id, [FromBody] AddPartyBalanceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (log, error) = await _service.AddBalanceAsync(id, request, CurrentUserId);
        if (log is null && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });

        return Ok(log);
    }

    [HttpPost("{id:int}/receive")]
    [Authorize(Policy = "party_names.edit")]
    public async Task<ActionResult<PartyBalanceLogListItemDto>> ReceiveAmount(int id, [FromBody] ReceivePartyAmountRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (log, error) = await _service.ReceiveAmountAsync(id, request, CurrentUserId);
        if (log is null && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });

        return Ok(log);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "party_names.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }
}
