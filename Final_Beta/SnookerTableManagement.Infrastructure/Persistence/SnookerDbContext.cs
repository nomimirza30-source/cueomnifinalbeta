using System;
using Microsoft.EntityFrameworkCore;
using SnookerTableManagement.Core.Domain.Entities;
using SnookerTableManagement.Core.Domain.Enums;

namespace SnookerTableManagement.Infrastructure.Persistence;

public class SnookerDbContext : DbContext
{
    public SnookerDbContext(DbContextOptions<SnookerDbContext> options) : base(options)
    {
    }

    public DbSet<SnookerTable> Tables { get; set; }
    public DbSet<TableSession> Sessions { get; set; }
    public DbSet<Rate> Rates { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<SessionItem> SessionItems { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Reservation> Reservations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<TableSession>()
            .HasOne(s => s.Table)
            .WithMany()
            .HasForeignKey(s => s.TableId);

        modelBuilder.Entity<SessionItem>()
            .HasOne(si => si.Session)
            .WithMany(s => s.Items)
            .HasForeignKey(si => si.SessionId);

        modelBuilder.Entity<SessionItem>()
            .HasOne(si => si.InventoryItem)
            .WithMany()
            .HasForeignKey(si => si.InventoryItemId);

        // Idempotency Key
        modelBuilder.Entity<TableSession>()
            .HasIndex(s => s.SyncId)
            .IsUnique();
    }
}
