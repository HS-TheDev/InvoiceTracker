using InvoiceTracker.API.Data;
using InvoiceTracker.API.DTOs;
using InvoiceTracker.API.Enumerations;
using InvoiceTracker.API.Models;
using InvoiceTracker.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext dbContext, TokenService tokenService) : ControllerBase
{
    private readonly AppDbContext _dbContext = dbContext;
    private readonly TokenService _tokenService = tokenService;

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
    {
        if (await _dbContext.Users.AnyAsync(u => u.Username == dto.Username))
            return BadRequest("Username already taken");
        if (await _dbContext.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Email already registered");

        var isFirstUser = !await _dbContext.Users.AnyAsync();
        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = isFirstUser ? UserRole.Admin : UserRole.Viewer
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var (token, expires) = _tokenService.CreateToken(user);
        return Ok(new AuthResponseDto(token, user.Username, user.Email, user.Role, expires));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

        var (token, expires) = _tokenService.CreateToken(user);
        return Ok(new AuthResponseDto(token, user.Username, user.Email, user.Role, expires));
    }
}
