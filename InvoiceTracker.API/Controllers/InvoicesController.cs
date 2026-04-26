using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<List<Invoice>>> GetAll()
    {
        var invoices = await _dbContext.Invoices.Include(i => i.Client).ToListAsync();
        return Ok(invoices);
    }

    [HttpPost]
    public async Task<ActionResult<List<Invoice>>> Create(Invoice invoice)
    {
        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = invoice.Id }, invoice);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int Id)
    {
        var invoice = await _dbContext.Invoices.FindAsync(Id);
        if (invoice == null)
        {
            return NotFound();
        }
        _dbContext.Invoices.Remove(invoice);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Invoice>> GetById(int id)
    {
        var invoice = await _dbContext.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null)
        {
            return NotFound();
        }
        return Ok(invoice);
    }

    [HttpGet]
    public async Task<ActionResult<List<Invoice>>> GetByClientId(int clientId)
    {
        var invoices = await _dbContext.Invoices.Where(i => i.ClientId == clientId).ToListAsync();
        return Ok(invoices);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Invoice>> Update(int Id, Invoice invoice)
    {
        if (Id != invoice.Id)
        {
            return BadRequest();
        }
        _dbContext.Entry(invoice).State = EntityState.Modified;
        await _dbContext.SaveChangesAsync();
        return Ok(invoice);
    }

}
