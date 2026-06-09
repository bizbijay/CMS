using CMS.Api.DTOs;
using CMS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CMS.Api.Controllers;

[ApiController]
[Route("api/salary-details")]
public class SalaryDetailController : ControllerBase
{
    private readonly ISalaryDetailService _service;

    public SalaryDetailController(ISalaryDetailService service)
    {
        _service = service;
    }

    // GET: api/salary-details
    [HttpGet]
    [Authorize(Policy = "salary_detail.view")]
    public async Task<ActionResult<IEnumerable<SalaryDetailDto>>> GetAll()
    {
        return Ok(await _service.GetAllAsync());
    }
}
