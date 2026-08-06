using System.Security.Claims;
using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/bank-accounts")]
public class BankAccountsController : ControllerBase
{
    private readonly IBankAccountService _service;

    public BankAccountsController(IBankAccountService service)
    {
        _service = service;
    }

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BankAccountListItemDto>>> GetAll() =>
        Ok(await _service.ListAsync());

    [HttpGet("balances")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<IEnumerable<BankAccountBalanceSummaryDto>>> GetBalances() =>
        Ok(await _service.ListBalancesAsync());

    [HttpGet("credit-logs")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<IEnumerable<BankAccountCreditLogListItemDto>>> GetCreditLogs() =>
        Ok(await _service.ListCreditLogsAsync());

    [HttpGet("debit-logs")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<IEnumerable<BankAccountDebitLogListItemDto>>> GetDebitLogs() =>
        Ok(await _service.ListDebitLogsAsync());

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<ActionResult<BankAccountListItemDto>> GetById(int id)
    {
        var item = await _service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = "bank_accounts.add")]
    public async Task<ActionResult<BankAccountListItemDto>> Create([FromBody] CreateBankAccountRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var item = await _service.CreateAsync(request, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpGet("{id:int}/credit-logs")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<IEnumerable<BankAccountCreditLogListItemDto>>> GetCreditLogsByAccount(int id)
    {
        var account = await _service.GetByIdAsync(id);
        if (account is null) return NotFound();

        var logs = await _service.ListCreditLogsByAccountAsync(id);
        return Ok(logs);
    }

    [HttpGet("{id:int}/debit-logs")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<IEnumerable<BankAccountDebitLogListItemDto>>> GetDebitLogsByAccount(int id)
    {
        var account = await _service.GetByIdAsync(id);
        if (account is null) return NotFound();

        var logs = await _service.ListDebitLogsByAccountAsync(id);
        return Ok(logs);
    }

    [HttpPost("{id:int}/balances")]
    [Authorize(Policy = "account_management.view")]
    public async Task<ActionResult<BankAccountCreditLogListItemDto>> AddBalance(int id, [FromBody] AddBankAccountBalanceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (item, error) = await _service.AddBalanceAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return BadRequest(new { message = error });

        return Ok(item);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "bank_accounts.edit")]
    public async Task<ActionResult<BankAccountListItemDto>> Update(int id, [FromBody] UpdateBankAccountRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var (item, error) = await _service.UpdateAsync(id, request, CurrentUserId);
        if (item is null && error is null) return NotFound();
        if (error is not null) return Conflict(new { message = error });
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "bank_accounts.delete")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/set-primary")]
    [Authorize(Policy = "bank_accounts.edit")]
    public async Task<ActionResult<BankAccountListItemDto>> SetPrimary(int id)
    {
        var item = await _service.SetPrimaryAsync(id, CurrentUserId);
        return item is null ? NotFound() : Ok(item);
    }
}
