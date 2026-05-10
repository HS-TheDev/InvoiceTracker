using System.ComponentModel.DataAnnotations;

namespace InvoiceTracker.API.DTOs;

public class RegisterDto
{
    [Required][MaxLength(50)] public string Username { get; set; } = string.Empty;
    [Required][EmailAddress][MaxLength(150)] public string Email { get; set; } = string.Empty;
    [Required][MinLength(6)] public string Password { get; set; } = string.Empty;
}

public class LoginDto
{
    [Required] public string Username { get; set; } = string.Empty;
    [Required] public string Password { get; set; } = string.Empty;
}

public record AuthResponseDto(string Token, string Username, string Email, string Role, DateTime ExpiresAt);
