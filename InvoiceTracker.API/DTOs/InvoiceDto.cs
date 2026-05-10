using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.DTOs;

public record InvoiceDto(
    int Id,
    string InvoiceNumber,
    DateTime IssueDate,
    DateTime DueDate,
    InvoiceStatus Status,
    decimal TotalAmount,
    int ClientId,
    string ClientName
);

public class CreateInvoiceDto
{
    [Required] public DateTime IssueDate { get; set; }
    [Required] public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    [Required][Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than 0")]
    public decimal TotalAmount { get; set; }
    [Required] public int ClientId { get; set; }
}

public class UpdateInvoiceDto
{
    public int Id { get; set; }
    [Required] public DateTime IssueDate { get; set; }
    [Required] public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    [Required][Range(0.01, double.MaxValue, ErrorMessage = "Total amount must be greater than 0")]
    public decimal TotalAmount { get; set; }
    [Required] public int ClientId { get; set; }
}
