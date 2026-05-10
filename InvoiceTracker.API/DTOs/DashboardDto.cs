namespace InvoiceTracker.API.DTOs;

public record DashboardDto(
    int TotalClients,
    int TotalInvoices,
    decimal TotalRevenue,
    decimal TotalCollected,
    int PaidInvoices,
    int PendingInvoices,
    int OverdueInvoices,
    List<InvoiceDto> RecentInvoices,
    List<InvoiceDto> OverdueInvoicesList
);
