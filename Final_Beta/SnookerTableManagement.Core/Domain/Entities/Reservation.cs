using System;

namespace SnookerTableManagement.Core.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public SnookerTable Table { get; set; } = null!;
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public bool IsSynced { get; set; }
}
