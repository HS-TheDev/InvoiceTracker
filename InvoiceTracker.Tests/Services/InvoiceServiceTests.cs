using InvoiceTracker.API.Data;
using InvoiceTracker.API.Models;
using InvoiceTracker.API.Services;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.Tests.Services;

public class InvoiceServiceTests
{
    private static AppDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GenerateInvoiceNumber_FirstInvoice_ReturnsSequence001()
    {
        using var ctx = NewContext();
        var service = new InvoiceService(ctx);

        var number = await service.GenerateInvoiceNumber(clientId: 5);

        Assert.Equal("INV-5-001", number);
    }

    [Fact]
    public async Task GenerateInvoiceNumber_IncrementsPerClient()
    {
        using var ctx = NewContext();
        ctx.Invoices.Add(new Invoice { ClientId = 5, InvoiceNumber = "INV-5-001", IssueDate = DateTime.Today, DueDate = DateTime.Today, TotalAmount = 100 });
        ctx.Invoices.Add(new Invoice { ClientId = 5, InvoiceNumber = "INV-5-002", IssueDate = DateTime.Today, DueDate = DateTime.Today, TotalAmount = 100 });
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        var number = await service.GenerateInvoiceNumber(clientId: 5);

        Assert.Equal("INV-5-003", number);
    }

    [Fact]
    public async Task AlreadyExists_ReturnsTrue_WhenNumberPresent()
    {
        using var ctx = NewContext();
        ctx.Invoices.Add(new Invoice { InvoiceNumber = "INV-1-001", ClientId = 1, IssueDate = DateTime.Today, DueDate = DateTime.Today, TotalAmount = 100 });
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        Assert.True(await service.alreadyExists("INV-1-001"));
        Assert.False(await service.alreadyExists("INV-9-999"));
    }

    [Fact]
    public async Task ProcessPayment_Rejects_WhenExceedsTotal()
    {
        using var ctx = NewContext();
        ctx.Invoices.Add(new Invoice { Id = 1, InvoiceNumber = "INV-1-001", ClientId = 1, TotalAmount = 100, IssueDate = DateTime.Today, DueDate = DateTime.Today.AddDays(30), Status = InvoiceStatus.Sent });
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        var result = await service.ProcessPayment(new Payment { InvoiceId = 1, AmountPaid = 150, PaymentDate = DateTime.Today, PaymentMethod = "Cash" });

        Assert.NotNull(result);
        Assert.Contains("exceeds", result, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ProcessPayment_SetsPaid_WhenTotalIsMet()
    {
        using var ctx = NewContext();
        var invoice = new Invoice { Id = 1, InvoiceNumber = "INV-1-001", ClientId = 1, TotalAmount = 100, IssueDate = DateTime.Today, DueDate = DateTime.Today.AddDays(30), Status = InvoiceStatus.Sent };
        ctx.Invoices.Add(invoice);
        ctx.Payments.Add(new Payment { Id = 1, InvoiceId = 1, AmountPaid = 60, PaymentDate = DateTime.Today, PaymentMethod = "Cash" });
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        var result = await service.ProcessPayment(new Payment { InvoiceId = 1, AmountPaid = 40, PaymentDate = DateTime.Today, PaymentMethod = "Cash" });

        Assert.Null(result);
        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
    }

    [Fact]
    public async Task ProcessPayment_SetsOverDue_WhenPaidLate_AndNotFullyPaid()
    {
        using var ctx = NewContext();
        var invoice = new Invoice { Id = 1, InvoiceNumber = "INV-1-001", ClientId = 1, TotalAmount = 100, IssueDate = DateTime.Today.AddDays(-40), DueDate = DateTime.Today.AddDays(-10), Status = InvoiceStatus.Sent };
        ctx.Invoices.Add(invoice);
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        var result = await service.ProcessPayment(new Payment { InvoiceId = 1, AmountPaid = 30, PaymentDate = DateTime.Today, PaymentMethod = "Cash" });

        Assert.Null(result);
        Assert.Equal(InvoiceStatus.OverDue, invoice.Status);
    }

    [Fact]
    public async Task RecalculateTotal_SumsLineItems()
    {
        using var ctx = NewContext();
        var invoice = new Invoice { Id = 1, InvoiceNumber = "INV-1-001", ClientId = 1, TotalAmount = 0, IssueDate = DateTime.Today, DueDate = DateTime.Today };
        ctx.Invoices.Add(invoice);
        ctx.InvoiceItems.Add(new InvoiceItem { InvoiceId = 1, Description = "A", Quantity = 2, UnitPrice = 50 });
        ctx.InvoiceItems.Add(new InvoiceItem { InvoiceId = 1, Description = "B", Quantity = 3, UnitPrice = 25 });
        await ctx.SaveChangesAsync();
        var service = new InvoiceService(ctx);

        await service.RecalculateTotal(1);

        Assert.Equal(175m, invoice.TotalAmount);
    }
}
