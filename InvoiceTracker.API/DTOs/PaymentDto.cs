using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.DTOs;

public record PaymentDto(
    int Id,
    decimal AmountPaid,
    DateTime PaymentDate,
    string PaymentMethod,
    int InvoiceId,
    string InvoiceNumber
);

public class CreatePaymentDto
{
    [Required][Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal AmountPaid { get; set; }
    [Required] public DateTime PaymentDate { get; set; }
    [Required][MaxLength(50)] public string PaymentMethod { get; set; } = string.Empty;
    [Required] public int InvoiceId { get; set; }
}

public class UpdatePaymentDto
{
    public int Id { get; set; }
    [Required][Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
    public decimal AmountPaid { get; set; }
    [Required] public DateTime PaymentDate { get; set; }
    [Required][MaxLength(50)] public string PaymentMethod { get; set; } = string.Empty;
    [Required] public int InvoiceId { get; set; }
}
