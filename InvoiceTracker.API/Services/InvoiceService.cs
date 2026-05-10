using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Services;

public class InvoiceService(AppDbContext dbContext)
{
    private readonly AppDbContext _dbContext = dbContext;

    public async Task<bool> alreadyExists(string invoiceNumber)
    {
        return await _dbContext.Invoices.AnyAsync(i => i.InvoiceNumber == invoiceNumber);
    }

    public async Task<string?> ProcessPayment(Payment payment)
    {
        var invoice = await _dbContext.Invoices.FindAsync(payment.InvoiceId);
        if (invoice == null) return "Invoice not found";

        var existingPayment = await _dbContext.Payments
            .Where(p => p.InvoiceId == payment.InvoiceId)
            .SumAsync(p => p.AmountPaid);

        var totalPaid = existingPayment + payment.AmountPaid;

        if (totalPaid > invoice.TotalAmount)
            return "Payment exceeds invoice total";

        if (totalPaid == invoice.TotalAmount)
            invoice.Status = InvoiceStatus.Paid;

        if (payment.PaymentDate > invoice.DueDate && invoice.Status != InvoiceStatus.Paid)
            invoice.Status = InvoiceStatus.OverDue;

        return null;
    }

    public async Task<string> GenerateInvoiceNumber(int clientId)
    {
        var count = await _dbContext.Invoices.Where(i => i.ClientId == clientId).CountAsync();
        return $"INV-{clientId}-{(count + 1):D3}";
    }

    public async Task RecalculateTotal(int invoiceId)
    {
        var invoice = await _dbContext.Invoices.FindAsync(invoiceId);
        if (invoice == null) return;

        var newTotal = await _dbContext.InvoiceItems
            .Where(i => i.InvoiceId == invoiceId)
            .SumAsync(i => (decimal?)(i.Quantity * i.UnitPrice)) ?? 0;

        if (newTotal > 0)
        {
            invoice.TotalAmount = newTotal;
            await _dbContext.SaveChangesAsync();
        }
    }
}
