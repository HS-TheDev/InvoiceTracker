namespace InvoiceTracker.API.DTOs;

public record PagedResult<T>(List<T> Items, int Total, int Skip, int Take);
