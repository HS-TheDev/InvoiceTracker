using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.DTOs;

public record InvoiceItemDto(int Id, string Description, int Quantity, decimal UnitPrice, decimal LineTotal, int InvoiceId);

public class CreateInvoiceItemDto
{
    [Required][MaxLength(250)] public string Description { get; set; } = string.Empty;
    [Required][Range(1, int.MaxValue)] public int Quantity { get; set; }
    [Required][Range(0.01, double.MaxValue)] public decimal UnitPrice { get; set; }
    [Required] public int InvoiceId { get; set; }
}

public class UpdateInvoiceItemDto
{
    public int Id { get; set; }
    [Required][MaxLength(250)] public string Description { get; set; } = string.Empty;
    [Required][Range(1, int.MaxValue)] public int Quantity { get; set; }
    [Required][Range(0.01, double.MaxValue)] public decimal UnitPrice { get; set; }
    [Required] public int InvoiceId { get; set; }
}
