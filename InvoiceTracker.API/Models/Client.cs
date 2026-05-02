using System.Text.Json.Serialization;

namespace InvoiceTracker.API.Models;

public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    [JsonIgnore]
    public List<Invoice> Invoices { get; set; } = new();
}