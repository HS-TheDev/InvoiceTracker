using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Enumerations;
using InvoiceTracker.API.Models;
using InvoiceTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PaymentsController(AppDbContext dbContext, InvoiceService invoiceService) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly InvoiceService _invoiceService = invoiceService;

    private static PaymentDto ToDto(Payment p) => new(
        p.Id, p.AmountPaid, p.PaymentDate, p.PaymentMethod, p.InvoiceId,
        p.Invoice?.InvoiceNumber ?? string.Empty
    );

    [HttpGet]
    public async Task<ActionResult<PagedResult<PaymentDto>>> GetAll(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 0)
    {
        var query = _dbContext.Payments.Include(p => p.Invoice).AsQueryable();
        var total = await query.CountAsync();
        if (take > 0)
            query = query.Skip(skip).Take(take);

        var items = (await query.ToListAsync()).Select(ToDto).ToList();
        return Ok(new PagedResult<PaymentDto>(items, total, skip, take));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PaymentDto>> GetById(int id)
    {
        var payment = await _dbContext.Payments.Include(p => p.Invoice).FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null) return NotFound();
        return Ok(ToDto(payment));
    }

    [HttpGet("invoice/{invoiceId}")]
    public async Task<ActionResult<List<PaymentDto>>> GetByInvoiceId(int invoiceId)
    {
        var payments = await _dbContext.Payments.Include(p => p.Invoice)
            .Where(p => p.InvoiceId == invoiceId).ToListAsync();
        return Ok(payments.Select(ToDto).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PaymentDto>> Create(CreatePaymentDto dto)
    {
        var payment = new Payment
        {
            AmountPaid = dto.AmountPaid,
            PaymentDate = dto.PaymentDate,
            PaymentMethod = dto.PaymentMethod,
            InvoiceId = dto.InvoiceId
        };
        var error = await _invoiceService.ProcessPayment(payment);
        if (error != null) return BadRequest(error);

        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();
        await _dbContext.Entry(payment).Reference(p => p.Invoice).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = payment.Id }, ToDto(payment));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PaymentDto>> Update(int id, UpdatePaymentDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var payment = await _dbContext.Payments.Include(p => p.Invoice).FirstOrDefaultAsync(p => p.Id == id);
        if (payment == null) return NotFound();

        payment.AmountPaid = dto.AmountPaid;
        payment.PaymentDate = dto.PaymentDate;
        payment.PaymentMethod = dto.PaymentMethod;
        payment.InvoiceId = dto.InvoiceId;
        await _dbContext.SaveChangesAsync();
        return Ok(ToDto(payment));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult> Delete(int id)
    {
        var payment = await _dbContext.Payments.FindAsync(id);
        if (payment == null) return NotFound();
        _dbContext.Payments.Remove(payment);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
