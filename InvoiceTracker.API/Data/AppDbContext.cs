using Microsoft.EntityFrameworkCore;
using InvoiceTracker.API.Models;

namespace InvoiceTracker.API.Data;

public class AppDbContext: DbContext
{
 public AppDbContext(DbContextOptions<AppDbContext> options): base(options){} 

 public DbSet<Client> Clients {get; set;}
 public DbSet<Payment> Payments {get; set;}
 public DbSet<Invoice> Invoices {get; set;}
 public DbSet<InvoiceItem> InvoiceItems {get; set;}  
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Invoice>()
        .Property(i => i.TotalAmount)
        .HasPrecision(18, 2);

    modelBuilder.Entity<InvoiceItem>()
        .Property(i => i.UnitPrice)
        .HasPrecision(18, 2);

    modelBuilder.Entity<Payment>()
        .Property(p => p.AmountPaid)
        .HasPrecision(18, 2);
}
}

