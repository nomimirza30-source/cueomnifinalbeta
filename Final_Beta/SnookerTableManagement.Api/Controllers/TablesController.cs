using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnookerTableManagement.Core.Domain.Entities;
using SnookerTableManagement.Infrastructure.Persistence;

namespace SnookerTableManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly SnookerDbContext _context;

    public TablesController(SnookerDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SnookerTable>>> GetTables()
    {
        return await _context.Tables.ToListAsync();
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        if (await _context.Tables.AnyAsync()) return BadRequest("Already seeded");

        for (int i = 1; i <= 10; i++)
        {
            _context.Tables.Add(new SnookerTable { TableNumber = i });
        }

        await _context.SaveChangesAsync();
        return Ok();
    }
}
