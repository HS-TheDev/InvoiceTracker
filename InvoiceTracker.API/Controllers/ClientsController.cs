using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Enumerations;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ClientsController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    private static ClientDto ToDto(Client c) => new(c.Id, c.Name, c.Email, c.Phone, c.Address);

    [HttpGet]
    public async Task<ActionResult<PagedResult<ClientDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 0)
    {
        var query = _dbContext.Clients.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || c.Email.Contains(search));

        var total = await query.CountAsync();
        if (take > 0)
            query = query.Skip(skip).Take(take);

        var items = await query.Select(c => new ClientDto(c.Id, c.Name, c.Email, c.Phone, c.Address)).ToListAsync();
        return Ok(new PagedResult<ClientDto>(items, total, skip, take));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClientDto>> GetById(int id)
    {
        var client = await _dbContext.Clients.FindAsync(id);
        if (client == null) return NotFound();
        return Ok(ToDto(client));
    }

    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create(CreateClientDto dto)
    {
        var client = new Client { Name = dto.Name, Email = dto.Email, Phone = dto.Phone, Address = dto.Address };
        _dbContext.Clients.Add(client);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, ToDto(client));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ClientDto>> Update(int id, UpdateClientDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var client = await _dbContext.Clients.FindAsync(id);
        if (client == null) return NotFound();

        client.Name = dto.Name;
        client.Email = dto.Email;
        client.Phone = dto.Phone;
        client.Address = dto.Address;
        await _dbContext.SaveChangesAsync();
        return Ok(ToDto(client));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult> Delete(int id)
    {
        var client = await _dbContext.Clients.FindAsync(id);
        if (client == null) return NotFound();
        _dbContext.Clients.Remove(client);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
