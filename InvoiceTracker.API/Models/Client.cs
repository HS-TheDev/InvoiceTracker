using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace InvoiceTracker.API.Models;

public class Client
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(250)]
    public string Address { get; set; } = string.Empty;

    [JsonIgnore]
    public List<Invoice> Invoices { get; set; } = new();
}