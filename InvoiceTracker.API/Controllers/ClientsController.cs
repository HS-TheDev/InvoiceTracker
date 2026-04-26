using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    public ClientsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }
   
    [HttpGet]
    public async Task<ActionResult<List<Client>>> GetAll()
    {
        var clients = await _dbContext.Clients.ToListAsync();
        return Ok(clients);
    }

    [HttpPost]
    public async Task<ActionResult<List<Client>>> Create(Client client)
    {
        if (client == null) return BadRequest("Data not correct");
        _dbContext.Clients.Add(client);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = client.Id }, client);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetById(int Id)
    {
        var client = await _dbContext.Clients.FindAsync(Id);
        if (client == null)
        {
            return NotFound();
        }
        return Ok(client);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int Id)
    {
        var client = await _dbContext.Clients.FindAsync(Id);
        if (client == null)
        {
            return NotFound();
        }
        _dbContext.Clients.Remove(client);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Client>> Update(int Id, Client client)
    {
        if (Id != client.Id)
        {
            return BadRequest();
        }

        _dbContext.Entry(client).State = EntityState.Modified;
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}

