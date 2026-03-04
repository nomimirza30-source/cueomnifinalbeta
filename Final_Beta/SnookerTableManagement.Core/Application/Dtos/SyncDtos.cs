using System;
using System.Collections.Generic;
using SnookerTableManagement.Core.Domain.Enums;

namespace SnookerTableManagement.Core.Application.Dtos;

public class SessionSyncDto
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public long StartTime { get; set; }
    public long? EndTime { get; set; }
    public BillingType BillingType { get; set; }
    public decimal TotalAmount { get; set; }
    public string SyncId { get; set; } = string.Empty; // UUID from client
    public List<SessionItemSyncDto> Items { get; set; } = new();
}

public class SessionItemSyncDto
{
    public Guid InventoryItemId { get; set; }
    public int Quantity { get; set; }
    public decimal PricePerItem { get; set; }
}

public class SyncResponseDto
{
    public List<string> SyncedIds { get; set; } = new();
    public List<string> FailedIds { get; set; } = new();
}

public class SyncStateDto
{
    public List<TableSyncDto> Tables { get; set; } = new();
    public List<SessionSyncDto> ActiveSessions { get; set; } = new();
    public List<CustomerSyncDto> Customers { get; set; } = new();
    public List<ReservationSyncDto> Reservations { get; set; } = new();
    public List<RateSyncDto> Rates { get; set; } = new();
}

public class RateSyncDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AmountPerHour { get; set; }
    public bool IsDefault { get; set; }
}

public class TableSyncDto
{
    public Guid Id { get; set; }
    public int TableNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
}

public class CustomerSyncDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int Points { get; set; }
    public long CreatedAt { get; set; } // Unix timestamp
}

public class ReservationSyncDto
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public Guid? CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public long StartTime { get; set; } // Unix timestamp
    public long EndTime { get; set; } // Unix timestamp
}
