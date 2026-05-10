using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController(AppDbContext dbContext) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get()
    {
        var totalClients = await _dbContext.Clients.CountAsync();
        var invoices = await _dbContext.Invoices.Include(i => i.Client).ToListAsync();
        var totalCollected = await _dbContext.Payments.SumAsync(p => (decimal?)p.AmountPaid) ?? 0;

        static InvoiceDto Map(Invoice i) => new(
            i.Id, i.InvoiceNumber, i.IssueDate, i.DueDate, i.Status, i.TotalAmount,
            i.ClientId, i.Client?.Name ?? string.Empty
        );

        var dto = new DashboardDto(
            TotalClients: totalClients,
            TotalInvoices: invoices.Count,
            TotalRevenue: invoices.Sum(i => i.TotalAmount),
            TotalCollected: totalCollected,
            PaidInvoices: invoices.Count(i => i.Status == InvoiceStatus.Paid),
            PendingInvoices: invoices.Count(i => i.Status == InvoiceStatus.Draft || i.Status == InvoiceStatus.Sent),
            OverdueInvoices: invoices.Count(i => i.Status == InvoiceStatus.OverDue),
            RecentInvoices: invoices.OrderByDescending(i => i.IssueDate).Take(5).Select(Map).ToList(),
            OverdueInvoicesList: invoices.Where(i => i.Status == InvoiceStatus.OverDue).Select(Map).ToList()
        );

        return Ok(dto);
    }
}
