using System;
using SnookerTableManagement.Core.Domain.Enums;

namespace SnookerTableManagement.Core.Domain.Entities;

public class SnookerTable
{
    public Guid Id { get; set; }
    public int TableNumber { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Available;
    public decimal HourlyRate { get; set; } = 10.00m;
}
