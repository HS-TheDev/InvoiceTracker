namespace InvoiceTracker.API.DTOs;

public record AiGenerateItemsRequest(string Description);
public record AiInvoiceItemSuggestion(string Description, int Quantity, decimal UnitPrice);
public record AiClientRiskResponse(int Score, string Level, string Summary);
public record AiDashboardQueryRequest(string Query);
public record AiDashboardQueryResponse(string Answer);
public record AiOverdueReminderResponse(string Subject, string Body);
