using System.Net;
using System.Net.Http.Json;
using InvoiceTracker.API.DTOs;

namespace InvoiceTracker.Tests.Integration;

public class AuthControllerTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public AuthControllerTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_FirstUser_BecomesAdmin()
    {
        var factory = new ApiFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterDto
        {
            Username = "admin1",
            Email = "admin1@test.com",
            Password = "secret123"
        });

        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);
        Assert.Equal("Admin", auth!.Role);
        Assert.False(string.IsNullOrWhiteSpace(auth.Token));
    }

    [Fact]
    public async Task Register_SecondUser_BecomesViewer()
    {
        var factory = new ApiFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/register", new RegisterDto { Username = "u1", Email = "u1@test.com", Password = "secret123" });
        var response = await client.PostAsJsonAsync("/api/auth/register", new RegisterDto { Username = "u2", Email = "u2@test.com", Password = "secret123" });

        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.Equal("Viewer", auth!.Role);
    }

    [Fact]
    public async Task Login_WrongPassword_Returns401()
    {
        var factory = new ApiFactory();
        var client = factory.CreateClient();

        await client.PostAsJsonAsync("/api/auth/register", new RegisterDto { Username = "bob", Email = "bob@test.com", Password = "rightpass" });
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginDto { Username = "bob", Password = "wrongpass" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_Returns401()
    {
        var factory = new ApiFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/clients");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithToken_Returns200()
    {
        var factory = new ApiFactory();
        var client = factory.CreateClient();

        var registerRes = await client.PostAsJsonAsync("/api/auth/register", new RegisterDto { Username = "alice", Email = "alice@test.com", Password = "secret123" });
        var auth = await registerRes.Content.ReadFromJsonAsync<AuthResponseDto>();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.Token);

        var response = await client.GetAsync("/api/clients");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
