using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentsController(AppDbContext dbContext) : ControllerBase
{
   private readonly AppDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<List<Payment>>> GetAll()
    {
        var payments = await _dbContext.Payments.ToListAsync();
        return Ok(payments);
    }

    [HttpPost]
    public async Task<ActionResult<List<Payment>>> Create(Payment payment)
    {
        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = payment.Id }, payment);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int Id)
    {
        var payment = await _dbContext.Payments.FindAsync(Id);
        if (payment == null)
        {
            return NotFound();
        }
        _dbContext.Payments.Remove(payment);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Payment>> GetById(int Id)
    {
        var payment = await _dbContext.Payments.FindAsync(Id);
        if (payment == null)
        {
            return NotFound();
        }
        return Ok(payment);
    }
     [HttpGet("invoice/{invoiceId}")]
     public async Task<ActionResult<List<Payment>>> GetByInvoiceId(int invoiceId)
     {
         var payments = await _dbContext.Payments.Where(p => p.InvoiceId == invoiceId).ToListAsync();
         return Ok(payments);
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<Payment>> Update(int Id, Payment payment)
    {
        if (Id != payment.Id)
        {
            return BadRequest();
        }
        _dbContext.Entry(payment).State = EntityState.Modified;
        await _dbContext.SaveChangesAsync();
        return Ok(payment);
    }

}
