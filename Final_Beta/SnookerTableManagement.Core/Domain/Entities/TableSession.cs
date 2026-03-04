using System;
using System.Collections.Generic;
using SnookerTableManagement.Core.Domain.Enums;

namespace SnookerTableManagement.Core.Domain.Entities;

public class TableSession
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public BillingType BillingType { get; set; }
    public decimal TotalAmount { get; set; }
    public string SyncId { get; set; } = string.Empty; // Idempotency Key
    public bool IsSynced { get; set; }

    public SnookerTable? Table { get; set; }
    public ICollection<SessionItem> Items { get; set; } = new List<SessionItem>();
}
