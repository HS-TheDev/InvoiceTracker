using System.Net.Http.Json;
using System.Text.Json;
using InvoiceTracker.API.DTOs;

namespace InvoiceTracker.API.Services;

public class AiService(IHttpClientFactory httpClientFactory, IConfiguration config)
{
    private readonly HttpClient _http = httpClientFactory.CreateClient();
    private readonly string _apiKey = config["Gemini:ApiKey"] ?? string.Empty;
    private readonly string _model = config["Gemini:Model"] ?? "gemini-2.0-flash";

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private string GeminiUrl =>
        $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

    private void EnsureKeyConfigured()
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || _apiKey.Contains("your-gemini"))
            throw new InvalidOperationException(
                "Gemini API key not configured. Set Gemini:ApiKey in appsettings or environment variables.");
    }

    private async Task<string> CallAsync(string prompt)
    {
        EnsureKeyConfigured();
        var body = new { contents = new[] { new { parts = new[] { new { text = prompt } } } } };
        using var response = await _http.PostAsJsonAsync(GeminiUrl, body);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }

    private async Task<string> CallJsonAsync(string prompt, object schema)
    {
        EnsureKeyConfigured();
        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { responseMimeType = "application/json", responseSchema = schema }
        };
        using var response = await _http.PostAsJsonAsync(GeminiUrl, body);
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        return json
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString() ?? string.Empty;
    }

    public async Task<List<AiInvoiceItemSuggestion>> GenerateInvoiceItemsAsync(string description)
    {
        var schema = new
        {
            type = "array",
            items = new
            {
                type = "object",
                properties = new
                {
                    description = new { type = "string" },
                    quantity = new { type = "integer" },
                    unitPrice = new { type = "number" }
                },
                required = new[] { "description", "quantity", "unitPrice" }
            }
        };

        var prompt = $"You are an invoice assistant. Suggest 3-5 professional invoice line items for: {description}. " +
                     "Use realistic Pakistani market rates. Return unitPrice as a plain number (PKR, no symbols).";

        var json = await CallJsonAsync(prompt, schema);
        return JsonSerializer.Deserialize<List<AiInvoiceItemSuggestion>>(json, JsonOpts) ?? [];
    }

    public async Task<AiClientRiskResponse> GetClientRiskScoreAsync(
        string clientName, decimal totalInvoiced, decimal totalPaid,
        int totalInvoices, int overdueCount, int paidCount)
    {
        var schema = new
        {
            type = "object",
            properties = new
            {
                score = new { type = "integer" },
                level = new { type = "string" },
                summary = new { type = "string" }
            },
            required = new[] { "score", "level", "summary" }
        };

        var payRate = totalInvoiced > 0 ? (int)(totalPaid / totalInvoiced * 100) : 0;
        var prompt = $"""
            Assess the payment risk for this client.
            Client: {clientName}
            Payment rate: {payRate}% (PKR {totalPaid:N0} paid of PKR {totalInvoiced:N0} invoiced)
            Invoices: {totalInvoices} total, {overdueCount} overdue, {paidCount} paid on time
            Return: score 0–100 (higher = lower risk), level "Low"/"Medium"/"High", summary in 2 sentences.
            """;

        var json = await CallJsonAsync(prompt, schema);
        return JsonSerializer.Deserialize<AiClientRiskResponse>(json, JsonOpts)
               ?? new AiClientRiskResponse(50, "Medium", "Unable to assess risk at this time.");
    }

    public async Task<string> AnswerDashboardQueryAsync(string query, DashboardDto dashboard)
    {
        var outstanding = dashboard.TotalRevenue - dashboard.TotalCollected;
        var overdueList = dashboard.OverdueInvoicesList.Count != 0
            ? string.Join(", ", dashboard.OverdueInvoicesList.Select(i => $"{i.InvoiceNumber} ({i.ClientName}, PKR {i.TotalAmount:N0})"))
            : "none";

        var prompt = $"""
            You are a business assistant. Answer using only this data — do not guess or make up numbers.
            Clients: {dashboard.TotalClients} | Invoices: {dashboard.TotalInvoices}
            Revenue: PKR {dashboard.TotalRevenue:N0} | Collected: PKR {dashboard.TotalCollected:N0} | Outstanding: PKR {outstanding:N0}
            Paid: {dashboard.PaidInvoices} | Pending: {dashboard.PendingInvoices} | Overdue: {dashboard.OverdueInvoices}
            Overdue: {overdueList}

            Question: {query}
            Answer in 2–3 sentences.
            """;

        return await CallAsync(prompt);
    }

    public async Task<AiOverdueReminderResponse> DraftOverdueReminderAsync(
        string clientName, string invoiceNumber, decimal amountOwed, int daysOverdue)
    {
        var schema = new
        {
            type = "object",
            properties = new
            {
                subject = new { type = "string" },
                body = new { type = "string" }
            },
            required = new[] { "subject", "body" }
        };

        var prompt = $"""
            Draft a professional payment reminder email. Polite but firm.
            Client: {clientName} | Invoice: {invoiceNumber}
            Amount overdue: PKR {amountOwed:N0} | Days overdue: {daysOverdue}
            Return JSON with "subject" (email subject line) and "body" (plain text email body, no HTML).
            """;

        var json = await CallJsonAsync(prompt, schema);
        return JsonSerializer.Deserialize<AiOverdueReminderResponse>(json, JsonOpts)
               ?? new AiOverdueReminderResponse(
                   $"Payment Reminder – {invoiceNumber}",
                   "Please make payment at your earliest convenience.");
    }
}
