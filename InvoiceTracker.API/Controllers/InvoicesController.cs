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
public class InvoicesController(AppDbContext dbContext, InvoiceService invoiceService, PdfService pdfService, EmailService emailService) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly InvoiceService _invoiceService = invoiceService;
    private readonly PdfService _pdfService = pdfService;
    private readonly EmailService _emailService = emailService;

    private static InvoiceDto ToDto(Invoice i) => new(
        i.Id, i.InvoiceNumber, i.IssueDate, i.DueDate, i.Status, i.TotalAmount,
        i.ClientId, i.Client?.Name ?? string.Empty
    );

    [HttpGet]
    public async Task<ActionResult<PagedResult<InvoiceDto>>> GetAll(
        [FromQuery] InvoiceStatus? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 0)
    {
        var query = _dbContext.Invoices.Include(i => i.Client).AsQueryable();
        if (status.HasValue)
            query = query.Where(i => i.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(i => i.InvoiceNumber.Contains(search) || i.Client!.Name.Contains(search));

        var total = await query.CountAsync();
        if (take > 0)
            query = query.Skip(skip).Take(take);

        var items = (await query.ToListAsync()).Select(ToDto).ToList();
        return Ok(new PagedResult<InvoiceDto>(items, total, skip, take));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDto>> GetById(int id)
    {
        var invoice = await _dbContext.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();
        return Ok(ToDto(invoice));
    }

    [HttpGet("client/{clientId}")]
    public async Task<ActionResult<List<InvoiceDto>>> GetByClientId(int clientId)
    {
        var invoices = await _dbContext.Invoices.Include(i => i.Client)
            .Where(i => i.ClientId == clientId).ToListAsync();
        return Ok(invoices.Select(ToDto).ToList());
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        var invoice = await _dbContext.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null || invoice.Client == null) return NotFound();

        var items = await _dbContext.InvoiceItems.Where(i => i.InvoiceId == id).ToListAsync();
        var payments = await _dbContext.Payments.Where(p => p.InvoiceId == id).ToListAsync();

        var pdf = _pdfService.GenerateInvoicePdf(invoice, invoice.Client, items, payments);
        return File(pdf, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceDto dto)
    {
        var invoice = new Invoice
        {
            IssueDate = dto.IssueDate,
            DueDate = dto.DueDate,
            Status = dto.Status,
            TotalAmount = dto.TotalAmount,
            ClientId = dto.ClientId
        };
        invoice.InvoiceNumber = await _invoiceService.GenerateInvoiceNumber(invoice.ClientId);
        if (await _invoiceService.alreadyExists(invoice.InvoiceNumber))
            return BadRequest("Invoice with the same number already exists.");

        _dbContext.Invoices.Add(invoice);
        await _dbContext.SaveChangesAsync();
        await _dbContext.Entry(invoice).Reference(i => i.Client).LoadAsync();
        return CreatedAtAction(nameof(GetById), new { id = invoice.Id }, ToDto(invoice));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceDto>> Update(int id, UpdateInvoiceDto dto)
    {
        if (id != dto.Id) return BadRequest("ID mismatch");
        var invoice = await _dbContext.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null) return NotFound();

        invoice.IssueDate = dto.IssueDate;
        invoice.DueDate = dto.DueDate;
        invoice.Status = dto.Status;
        invoice.TotalAmount = dto.TotalAmount;
        invoice.ClientId = dto.ClientId;
        await _dbContext.SaveChangesAsync();
        await _dbContext.Entry(invoice).Reference(i => i.Client).LoadAsync();
        return Ok(ToDto(invoice));
    }

    [HttpPost("{id}/send-email")]
    public async Task<IActionResult> SendEmail(int id)
    {
        var invoice = await _dbContext.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == id);
        if (invoice == null || invoice.Client == null) return NotFound();

        var items = await _dbContext.InvoiceItems.Where(i => i.InvoiceId == id).ToListAsync();
        var payments = await _dbContext.Payments.Where(p => p.InvoiceId == id).ToListAsync();

        var pdf = _pdfService.GenerateInvoicePdf(invoice, invoice.Client, items, payments);
        await _emailService.SendInvoiceAsync(invoice, invoice.Client, pdf);
        return Ok(new { message = "Invoice emailed successfully." });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = UserRole.Admin)]
    public async Task<ActionResult> Delete(int id)
    {
        var invoice = await _dbContext.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();
        _dbContext.Invoices.Remove(invoice);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
