using InvoiceTracker.API.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InvoiceTracker.API.Services;

public class PdfService
{
    static PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateInvoicePdf(Invoice invoice, Client client, List<InvoiceItem> items, List<Payment> payments)
    {
        var totalPaid = payments.Sum(p => p.AmountPaid);
        var balance = invoice.TotalAmount - totalPaid;

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(s => s.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("INVOICE").FontSize(28).Bold().FontColor(Colors.Blue.Darken3);
                            c.Item().Text(invoice.InvoiceNumber).FontSize(12).SemiBold();
                        });
                        row.RelativeItem().AlignRight().Column(c =>
                        {
                            c.Item().Text($"Issue Date: {invoice.IssueDate:dd MMM yyyy}");
                            c.Item().Text($"Due Date: {invoice.DueDate:dd MMM yyyy}");
                            c.Item().Text($"Status: {invoice.Status}").SemiBold();
                        });
                    });
                    col.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    col.Spacing(15);

                    col.Item().Column(c =>
                    {
                        c.Item().Text("Bill To").SemiBold().FontColor(Colors.Grey.Darken2);
                        c.Item().Text(client.Name).FontSize(12).SemiBold();
                        c.Item().Text(client.Email);
                        c.Item().Text(client.Phone);
                        if (!string.IsNullOrWhiteSpace(client.Address))
                            c.Item().Text(client.Address);
                    });

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(4);
                            c.RelativeColumn(1);
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).Text("Description").SemiBold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Qty").SemiBold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Unit Price").SemiBold();
                            h.Cell().Background(Colors.Grey.Lighten3).Padding(5).AlignRight().Text("Total").SemiBold();
                        });

                        if (items.Count == 0)
                        {
                            table.Cell().ColumnSpan(4).Padding(5).AlignCenter().Text("No line items").Italic().FontColor(Colors.Grey.Medium);
                        }
                        else
                        {
                            foreach (var item in items)
                            {
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).Text(item.Description);
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text(item.Quantity.ToString());
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"PKR {item.UnitPrice:N2}");
                                table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(5).AlignRight().Text($"PKR {item.Quantity * item.UnitPrice:N2}");
                            }
                        }
                    });

                    col.Item().AlignRight().Width(220).Column(c =>
                    {
                        c.Spacing(4);
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Subtotal");
                            r.ConstantItem(100).AlignRight().Text($"PKR {invoice.TotalAmount:N2}");
                        });
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Paid");
                            r.ConstantItem(100).AlignRight().Text($"PKR {totalPaid:N2}").FontColor(Colors.Green.Darken2);
                        });
                        c.Item().LineHorizontal(0.5f).LineColor(Colors.Grey.Medium);
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Balance Due").Bold();
                            r.ConstantItem(100).AlignRight().Text($"PKR {balance:N2}").Bold();
                        });
                    });

                    if (payments.Count > 0)
                    {
                        col.Item().PaddingTop(10).Text("Payment History").SemiBold().FontColor(Colors.Grey.Darken2);
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(c =>
                            {
                                c.RelativeColumn(2);
                                c.RelativeColumn(2);
                                c.RelativeColumn(2);
                            });
                            table.Header(h =>
                            {
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Date").SemiBold();
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(4).Text("Method").SemiBold();
                                h.Cell().Background(Colors.Grey.Lighten3).Padding(4).AlignRight().Text("Amount").SemiBold();
                            });
                            foreach (var p in payments)
                            {
                                table.Cell().Padding(4).Text(p.PaymentDate.ToString("dd MMM yyyy"));
                                table.Cell().Padding(4).Text(p.PaymentMethod);
                                table.Cell().Padding(4).AlignRight().Text($"PKR {p.AmountPaid:N2}");
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Thank you for your business").FontColor(Colors.Grey.Darken2);
                });
            });
        });

        return doc.GeneratePdf();
    }
}
