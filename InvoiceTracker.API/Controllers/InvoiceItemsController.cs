using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Models;
using InvoiceTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class InvoiceItemsController(AppDbContext dbContext, InvoiceService invoiceService) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly InvoiceService _invoiceService = invoiceService;

    private static InvoiceItemDto ToDto(InvoiceItem i) =>
        new(i.Id, i.Description, i.Quantity, i.UnitPrice, i.Quantity * i.UnitPrice, i.InvoiceId);

    [HttpGet]
    public async Task<ActionResult<List<InvoiceItemDto>>> GetAll()
    {
        var items = await _dbContext.InvoiceItems.ToListAsync();
        return Ok(items.Select(ToDto).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceItemDto>> GetById(int id)
    {
        var item = await _dbContext.InvoiceItems.FindAsync(id);
        if (item == null) return NotFound();
        return Ok(ToDto(item));
    }

    [HttpGet("invoice/{invoiceId}")]
    public async Task<ActionResult<List<InvoiceItemDto>>> GetByInvoiceId(int invoiceId)
    {
        var items = await _dbContext.InvoiceItems.Where(i => i.InvoiceId == invoiceId).ToListAsync();
        return Ok(items.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceItemDto>> Create(CreateInvoiceItemDto dto)
    {
        var item = new InvoiceItem
        {
            Description = dto.Description,
            Quantity = dto.Quantity,
            UnitPrice = dto.UnitPrice,
            InvoiceId = dto.InvoiceId
        };
        _dbContext.InvoiceItems.Add(item);
        await _dbContext.SaveChangesAsync();
        await _invoiceService.RecalculateTotal(item.InvoiceId);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, ToDto(item));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceItemDto>> Update(int id, UpdateInvoiceItemDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var item = await _dbContext.InvoiceItems.FindAsync(id);
        if (item == null) return NotFound();

        item.Description = dto.Description;
        item.Quantity = dto.Quantity;
        item.UnitPrice = dto.UnitPrice;
        item.InvoiceId = dto.InvoiceId;
        await _dbContext.SaveChangesAsync();
        await _invoiceService.RecalculateTotal(item.InvoiceId);
        return Ok(ToDto(item));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await _dbContext.InvoiceItems.FindAsync(id);
        if (item == null) return NotFound();
        var invoiceId = item.InvoiceId;
        _dbContext.InvoiceItems.Remove(item);
        await _dbContext.SaveChangesAsync();
        await _invoiceService.RecalculateTotal(invoiceId);
        return NoContent();
    }
}
