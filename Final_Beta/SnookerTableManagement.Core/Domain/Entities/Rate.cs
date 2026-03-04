using System;

namespace SnookerTableManagement.Core.Domain.Entities;

public class Rate
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal AmountPerHour { get; set; }
    public bool IsDefault { get; set; }
}
