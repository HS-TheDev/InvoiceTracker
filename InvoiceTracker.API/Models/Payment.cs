using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace InvoiceTracker.API.Models;

public class Payment
{
    public int Id { get; set; }
    [Required][Range(0.01, double.MaxValue)] public decimal AmountPaid { get; set; }
    [Required] public DateTime PaymentDate { get; set; }
    [Required][MaxLength(50)] public string PaymentMethod { get; set; } = string.Empty;
    [Required] public int InvoiceId { get; set; }
    [JsonIgnore] public Invoice? Invoice { get; set; }
}
