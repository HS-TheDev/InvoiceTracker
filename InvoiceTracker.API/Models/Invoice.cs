namespace InvoiceTracker.API.Models;

public class Invoice
{
    public int Id {get; set; }
    public string InvoiceNumber {get;set;} = string.Empty;
    public DateTime IssueDate {get;set;}
    public DateTime DueDate {get;set;}
    public InvoiceStatus Status {get; set;}
    public decimal TotalAmount {get;set;}
    public int ClientId {get;set;}
    public Client Client {get;set;} = null!;
    public List<InvoiceItem> InvoiceItems {get; set;} = new();
    public List<Payment> Payments {get; set; }= new();
}
