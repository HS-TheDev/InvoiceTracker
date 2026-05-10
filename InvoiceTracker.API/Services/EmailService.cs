using InvoiceTracker.API.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace InvoiceTracker.API.Services;

public class EmailService(IConfiguration config)
{
    private readonly string _host = config["Email:Host"] ?? "smtp.gmail.com";
    private readonly int _port = int.Parse(config["Email:Port"] ?? "587");
    private readonly string _username = config["Email:Username"] ?? string.Empty;
    private readonly string _password = config["Email:Password"] ?? string.Empty;
    private readonly string _fromName = config["Email:FromName"] ?? "Invoice Tracker";

    public async Task SendInvoiceAsync(Invoice invoice, Client client, byte[] pdfBytes)
    {
        if (string.IsNullOrWhiteSpace(_username) || string.IsNullOrWhiteSpace(_password)
            || _username.Contains("your-gmail"))
            throw new InvalidOperationException(
                "Email not configured. Set Email:Username and Email:Password in appsettings or environment variables.");

        if (string.IsNullOrWhiteSpace(client.Email))
            throw new InvalidOperationException("Client has no email address.");

        using var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _username));
        message.To.Add(new MailboxAddress(client.Name, client.Email));
        message.Subject = $"Invoice {invoice.InvoiceNumber} — Payment Due";

        var builder = new BodyBuilder
        {
            HtmlBody = $"""
                <p>Dear {client.Name},</p>
                <p>Please find attached invoice <strong>{invoice.InvoiceNumber}</strong> for your records.</p>
                <table style="border-collapse:collapse;margin:12px 0">
                  <tr><td style="padding:4px 12px 4px 0;color:#555">Amount Due:</td>
                      <td style="padding:4px 0;font-weight:bold">{invoice.TotalAmount:N2}</td></tr>
                  <tr><td style="padding:4px 12px 4px 0;color:#555">Due Date:</td>
                      <td style="padding:4px 0">{invoice.DueDate:MMMM dd, yyyy}</td></tr>
                </table>
                <p>Please make payment by the due date. Do not hesitate to reach out if you have any questions.</p>
                <p>Thank you for your business.</p>
                <p>Regards,<br><strong>{_fromName}</strong></p>
                """
        };
        builder.Attachments.Add(
            $"{invoice.InvoiceNumber}.pdf",
            pdfBytes,
            new ContentType("application", "pdf"));
        message.Body = builder.ToMessageBody();

        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(_host, _port, SecureSocketOptions.StartTls);
        await smtp.AuthenticateAsync(_username, _password);
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}
