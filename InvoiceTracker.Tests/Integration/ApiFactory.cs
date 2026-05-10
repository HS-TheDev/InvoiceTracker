using InvoiceTracker.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InvoiceTracker.Tests.Integration;

public class ApiFactory : WebApplicationFactory<Program>
{
    public string DatabaseName { get; } = $"TestDb-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.ConfigureServices(services =>
        {
            var toRemove = services
                .Where(d =>
                    (d.ServiceType.FullName?.Contains("DbContextOptions") == true) ||
                    d.ServiceType == typeof(AppDbContext) ||
                    d.ImplementationType?.Namespace?.StartsWith("Microsoft.EntityFrameworkCore.SqlServer") == true)
                .ToList();
            foreach (var d in toRemove) services.Remove(d);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(DatabaseName));

            using var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            ctx.Database.EnsureCreated();
        });
    }
}
