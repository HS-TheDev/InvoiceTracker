using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace InvoiceTracker.API.Models;

public class InvoiceItem
{
    public int Id { get; set; }
    [Required][MaxLength(250)] public string Description { get; set; } = string.Empty;
    [Required][Range(1, int.MaxValue)] public int Quantity { get; set; }
    [Required][Range(0.01, double.MaxValue)] public decimal UnitPrice { get; set; }
    [Required] public int InvoiceId { get; set; }
    [JsonIgnore] public Invoice? Invoice { get; set; }
}
