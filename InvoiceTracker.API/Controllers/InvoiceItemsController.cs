using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoiceItemsController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;
    [HttpGet]
    public async Task<ActionResult<List<InvoiceItem>>> GetAll()
    {
        var invoiceItems = await _dbContext.InvoiceItems.ToListAsync();
        return Ok(invoiceItems);
    }

    [HttpPost]
    public async Task<ActionResult<List<InvoiceItem>>> Create(InvoiceItem invoiceItem)
    {
        _dbContext.InvoiceItems.Add(invoiceItem);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = invoiceItem.Id }, invoiceItem);
    }
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int Id)
    {
        var invoiceItem = await _dbContext.InvoiceItems.FindAsync(Id);
        if (invoiceItem == null)
        {
            return NotFound();
        }
        _dbContext.InvoiceItems.Remove(invoiceItem);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceItem>> GetById(int Id)
    {
        var invoiceItem = await _dbContext.InvoiceItems.FindAsync(Id);
        if (invoiceItem == null)
        {
            return NotFound();
        }
        return Ok(invoiceItem);
    }
    [HttpGet("invoice/{invoiceId}")]
    public async Task<ActionResult<List<InvoiceItem>>> GetByInvoiceId(int invoiceId)
    {
        var invoiceItems = await _dbContext.InvoiceItems.Where(ii => ii.InvoiceId == invoiceId).ToListAsync();
        return Ok(invoiceItems);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceItem>> Update(int Id, InvoiceItem invoiceItem)
    {
        if (Id != invoiceItem.Id)
        {
            return BadRequest();
        }
        var existingInvoiceItem = await _dbContext.InvoiceItems.FindAsync(Id);
        if (existingInvoiceItem == null)
        {
            return NotFound();
        }
        existingInvoiceItem.Description = invoiceItem.Description;
        existingInvoiceItem.Quantity = invoiceItem.Quantity;
        existingInvoiceItem.UnitPrice = invoiceItem.UnitPrice;
        existingInvoiceItem.InvoiceId = invoiceItem.InvoiceId;
        await _dbContext.SaveChangesAsync();
        return Ok(existingInvoiceItem);
    }

}
