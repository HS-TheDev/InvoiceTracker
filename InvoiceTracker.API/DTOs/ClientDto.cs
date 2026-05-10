using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.DTOs;

public record ClientDto(int Id, string Name, string Email, string Phone, string Address);

public class CreateClientDto
{
    [Required][MaxLength(100)] public string Name { get; set; } = string.Empty;
    [Required][EmailAddress][MaxLength(150)] public string Email { get; set; } = string.Empty;
    [Required][MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [MaxLength(250)] public string Address { get; set; } = string.Empty;
}

public class UpdateClientDto
{
    public int Id { get; set; }
    [Required][MaxLength(100)] public string Name { get; set; } = string.Empty;
    [Required][EmailAddress][MaxLength(150)] public string Email { get; set; } = string.Empty;
    [Required][MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [MaxLength(250)] public string Address { get; set; } = string.Empty;
}
