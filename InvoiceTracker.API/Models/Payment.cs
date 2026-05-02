using System.Text.Json.Serialization;

namespace InvoiceTracker.API.Models;

public class Payment
{
    public int Id { get; set; }
    public decimal AmountPaid { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public int InvoiceId { get; set; }

    [JsonIgnore]
    public Invoice? Invoice { get; set; }
}