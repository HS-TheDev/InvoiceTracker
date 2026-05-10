using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.Models;

public class User
{
    public int Id { get; set; }
    [Required][MaxLength(50)] public string Username { get; set; } = string.Empty;
    [Required][EmailAddress][MaxLength(150)] public string Email { get; set; } = string.Empty;
    [Required] public string PasswordHash { get; set; } = string.Empty;
    [Required][MaxLength(20)] public string Role { get; set; } = "Viewer";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
