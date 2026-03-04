using System;

namespace SnookerTableManagement.Core.Domain.Entities;

public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int Points { get; set; }
    public DateTime CreatedAt { get; set; }
}
