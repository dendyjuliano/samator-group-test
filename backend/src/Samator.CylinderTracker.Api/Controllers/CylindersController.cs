using Microsoft.AspNetCore.Mvc;
using Samator.CylinderTracker.Api.Dtos;
using Samator.CylinderTracker.Api.Services;

namespace Samator.CylinderTracker.Api.Controllers;

[ApiController]
[Route("api/cylinders")]
public class CylindersController : ControllerBase
{
    private readonly ICylinderService _service;

    public CylindersController(ICylinderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<CylinderResponse>>> List(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _service.ListAsync(search, status, page, pageSize, ct);
            return Ok(result);
        }
        catch (CylinderValidationException ex)
        {
            return ValidationProblem(ex);
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CylinderResponse>> GetById(int id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CylinderResponse>> Create([FromBody] CreateCylinderRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateAsync(request, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (CylinderValidationException ex)
        {
            return ValidationProblem(ex);
        }
        catch (CylinderConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CylinderResponse>> Update(int id, [FromBody] UpdateCylinderRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.UpdateAsync(id, request, ct);
            return Ok(result);
        }
        catch (CylinderNotFoundException)
        {
            return NotFound();
        }
        catch (CylinderValidationException ex)
        {
            return ValidationProblem(ex);
        }
        catch (CylinderConflictException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/status")]
    public async Task<ActionResult<CylinderResponse>> ChangeStatus(int id, [FromBody] ChangeStatusRequest request, CancellationToken ct)
    {
        try
        {
            var result = await _service.ChangeStatusAsync(id, request, ct);
            return Ok(result);
        }
        catch (CylinderNotFoundException)
        {
            return NotFound();
        }
        catch (CylinderValidationException ex)
        {
            return ValidationProblem(ex);
        }
    }

    private ActionResult ValidationProblem(CylinderValidationException ex)
    {
        var problemDetails = new ValidationProblemDetails(ex.Errors)
        {
            Title = "One or more validation errors occurred.",
            Status = StatusCodes.Status400BadRequest,
        };

        return BadRequest(problemDetails);
    }
}
