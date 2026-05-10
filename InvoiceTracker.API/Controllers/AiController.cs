using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Enumerations;
using InvoiceTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AiController(AiService aiService, AppDbContext dbContext) : ControllerBase
{
    private readonly AiService _ai = aiService;
    private readonly AppDbContext _db = dbContext;

    [HttpPost("generate-items")]
    public async Task<ActionResult<List<AiInvoiceItemSuggestion>>> GenerateItems(AiGenerateItemsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Description))
            return BadRequest("Description is required.");
        var items = await _ai.GenerateInvoiceItemsAsync(request.Description);
        return Ok(items);
    }

    [HttpGet("client-risk/{clientId:int}")]
    public async Task<ActionResult<AiClientRiskResponse>> GetClientRisk(int clientId)
    {
        var client = await _db.Clients.FindAsync(clientId);
        if (client == null) return NotFound();

        var invoices = await _db.Invoices.Where(i => i.ClientId == clientId).ToListAsync();
        var invoiceIds = invoices.Select(i => i.Id).ToList();
        var payments = await _db.Payments.Where(p => invoiceIds.Contains(p.InvoiceId)).ToListAsync();

        var result = await _ai.GetClientRiskScoreAsync(
            client.Name,
            invoices.Sum(i => i.TotalAmount),
            payments.Sum(p => p.AmountPaid),
            invoices.Count,
            invoices.Count(i => i.Status == InvoiceStatus.OverDue),
            invoices.Count(i => i.Status == InvoiceStatus.Paid));

        return Ok(result);
    }

    [HttpPost("dashboard-query")]
    public async Task<ActionResult<AiDashboardQueryResponse>> DashboardQuery(AiDashboardQueryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest("Query is required.");

        var invoices = await _db.Invoices.Include(i => i.Client).ToListAsync();
        var totalCollected = await _db.Payments.SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;

        var dashboard = new DashboardDto(
            TotalClients: await _db.Clients.CountAsync(),
            TotalInvoices: invoices.Count,
            TotalRevenue: invoices.Sum(i => i.TotalAmount),
            TotalCollected: totalCollected,
            PaidInvoices: invoices.Count(i => i.Status == InvoiceStatus.Paid),
            PendingInvoices: invoices.Count(i => i.Status is InvoiceStatus.Draft or InvoiceStatus.Sent),
            OverdueInvoices: invoices.Count(i => i.Status == InvoiceStatus.OverDue),
            RecentInvoices: invoices
                .OrderByDescending(i => i.IssueDate).Take(5)
                .Select(i => new InvoiceDto(i.Id, i.InvoiceNumber, i.IssueDate, i.DueDate, i.Status, i.TotalAmount,
                    i.ClientId, i.Client?.Name ?? ""))
                .ToList(),
            OverdueInvoicesList: invoices
                .Where(i => i.Status == InvoiceStatus.OverDue)
                .Select(i => new InvoiceDto(i.Id, i.InvoiceNumber, i.IssueDate, i.DueDate, i.Status, i.TotalAmount,
                    i.ClientId, i.Client?.Name ?? ""))
                .ToList()
        );

        var answer = await _ai.AnswerDashboardQueryAsync(request.Query, dashboard);
        return Ok(new AiDashboardQueryResponse(answer));
    }

    [HttpGet("overdue-reminder/{invoiceId:int}")]
    public async Task<ActionResult<AiOverdueReminderResponse>> GetOverdueReminder(int invoiceId)
    {
        var invoice = await _db.Invoices.Include(i => i.Client).FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice == null || invoice.Client == null) return NotFound();

        var totalPaid = await _db.Payments
            .Where(p => p.InvoiceId == invoiceId)
            .SumAsync(p => (decimal?)p.AmountPaid) ?? 0m;

        var amountOwed = invoice.TotalAmount - totalPaid;
        var daysOverdue = Math.Max(0, (int)(DateTime.UtcNow - invoice.DueDate).TotalDays);

        var reminder = await _ai.DraftOverdueReminderAsync(
            invoice.Client.Name, invoice.InvoiceNumber, amountOwed, daysOverdue);

        return Ok(reminder);
    }
}
