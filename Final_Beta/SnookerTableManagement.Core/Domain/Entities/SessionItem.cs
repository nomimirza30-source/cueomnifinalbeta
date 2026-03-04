using System;

namespace SnookerTableManagement.Core.Domain.Entities;

public class SessionItem
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid InventoryItemId { get; set; }
    public int Quantity { get; set; }
    public decimal PricePerItem { get; set; }

    public TableSession? Session { get; set; }
    public InventoryItem? InventoryItem { get; set; }
}
