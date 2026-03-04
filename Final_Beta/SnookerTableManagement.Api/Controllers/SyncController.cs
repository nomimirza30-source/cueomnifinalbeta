using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using SnookerTableManagement.Infrastructure.Persistence;
using SnookerTableManagement.Core.Application.Dtos;
using SnookerTableManagement.Infrastructure.Hubs;
using SnookerTableManagement.Core.Domain.Entities;
using SnookerTableManagement.Core.Domain.Enums;

namespace SnookerTableManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly SnookerDbContext _context;
    private readonly IHubContext<TableHub> _hubContext;

    public SyncController(SnookerDbContext context, IHubContext<TableHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    [HttpGet("state")]
    public async Task<ActionResult<SyncStateDto>> GetState()
    {
        var tables = await _context.Tables
            .Select(t => new TableSyncDto 
            { 
                Id = t.Id, 
                TableNumber = t.TableNumber, 
                Status = t.Status.ToString(),
                HourlyRate = t.HourlyRate
            }).ToListAsync();

        var activeSessions = await _context.Sessions
            .Where(s => s.EndTime == null)
            .Include(s => s.Items)
            .Select(s => new SessionSyncDto
            {
                Id = s.Id,
                TableId = s.TableId,
                StartTime = new DateTimeOffset(s.StartTime).ToUnixTimeMilliseconds(),
                EndTime = s.EndTime.HasValue ? new DateTimeOffset(s.EndTime.Value).ToUnixTimeMilliseconds() : null,
                BillingType = s.BillingType,
                TotalAmount = s.TotalAmount,
                SyncId = s.SyncId,
                Items = s.Items.Select(i => new SessionItemSyncDto
                {
                    InventoryItemId = i.InventoryItemId,
                    Quantity = i.Quantity,
                    PricePerItem = i.PricePerItem
                }).ToList()
            }).ToListAsync();

        var customers = await _context.Customers
            .Select(c => new CustomerSyncDto
            {
                Id = c.Id,
                Name = c.Name,
                Email = c.Email,
                Phone = c.Phone,
                Points = c.Points,
                CreatedAt = ((DateTimeOffset)c.CreatedAt).ToUnixTimeMilliseconds()
            }).ToListAsync();

        var reservations = await _context.Reservations
            .Select(r => new ReservationSyncDto
            {
                Id = r.Id,
                TableId = r.TableId,
                CustomerId = r.CustomerId,
                CustomerName = r.CustomerName,
                StartTime = ((DateTimeOffset)r.StartTime).ToUnixTimeMilliseconds(),
                EndTime = ((DateTimeOffset)r.EndTime).ToUnixTimeMilliseconds()
            }).ToListAsync();

        var rates = await _context.Rates
            .Select(r => new RateSyncDto
            {
                Id = r.Id,
                Name = r.Name,
                AmountPerHour = r.AmountPerHour,
                IsDefault = r.IsDefault
            }).ToListAsync();

        return Ok(new SyncStateDto
        {
            Tables = tables,
            ActiveSessions = activeSessions,
            Customers = customers,
            Reservations = reservations,
            Rates = rates
        });
    }

    [HttpPost("rates")]
    public async Task<ActionResult<SyncResponseDto>> SyncRates([FromBody] List<RateSyncDto> rates)
    {
        var response = new SyncResponseDto();
        foreach (var rDto in rates)
        {
            try {
                var existing = await _context.Rates.FindAsync(rDto.Id);
                if (existing != null) {
                    existing.Name = rDto.Name;
                    existing.AmountPerHour = rDto.AmountPerHour;
                    existing.IsDefault = rDto.IsDefault;
                } else {
                    _context.Rates.Add(new Rate {
                        Id = rDto.Id,
                        Name = rDto.Name,
                        AmountPerHour = rDto.AmountPerHour,
                        IsDefault = rDto.IsDefault
                    });
                }
                await _context.SaveChangesAsync();
                response.SyncedIds.Add(rDto.Id.ToString());
            } catch { response.FailedIds.Add(rDto.Id.ToString()); }
        }
        await _hubContext.Clients.All.SendAsync("OnDataChanged", "Rates");
        return Ok(response);
    }

    [HttpPost("tables")]
    public async Task<ActionResult<SyncResponseDto>> SyncTables([FromBody] List<TableSyncDto> tables)
    {
        var response = new SyncResponseDto();
        foreach (var tDto in tables)
        {
            try {
                var existing = await _context.Tables.FindAsync(tDto.Id);
                if (existing != null) {
                    existing.TableNumber = tDto.TableNumber;
                    // Don't overwrite status here as it's driven by sessions
                } else {
                    _context.Tables.Add(new SnookerTable {
                        Id = tDto.Id,
                        TableNumber = tDto.TableNumber,
                        Status = Enum.Parse<TableStatus>(tDto.Status)
                    });
                }
                await _context.SaveChangesAsync();
                response.SyncedIds.Add(tDto.Id.ToString());
            } catch { response.FailedIds.Add(tDto.Id.ToString()); }
        }
        await _hubContext.Clients.All.SendAsync("OnDataChanged", "Tables");
        return Ok(response);
    }

    [HttpPost("sessions")]
    public async Task<ActionResult<SyncResponseDto>> SyncSessions([FromBody] List<SessionSyncDto> sessions)
    {
        var response = new SyncResponseDto();

        foreach (var sessionDto in sessions)
        {
            try
            {
                // check idempotency
                var existing = await _context.Sessions
                    .AnyAsync(s => s.SyncId == sessionDto.SyncId);

                if (existing)
                {
                    response.SyncedIds.Add(sessionDto.SyncId);
                    continue;
                }

                var session = new TableSession
                {
                    Id = sessionDto.Id == Guid.Empty ? Guid.NewGuid() : sessionDto.Id,
                    TableId = sessionDto.TableId,
                    StartTime = DateTimeOffset.FromUnixTimeMilliseconds(sessionDto.StartTime).DateTime,
                    EndTime = sessionDto.EndTime.HasValue ? DateTimeOffset.FromUnixTimeMilliseconds(sessionDto.EndTime.Value).DateTime : null,
                    BillingType = sessionDto.BillingType,
                    TotalAmount = sessionDto.TotalAmount,
                    SyncId = sessionDto.SyncId,
                    IsSynced = true
                };

                foreach (var itemDto in sessionDto.Items)
                {
                    session.Items.Add(new SessionItem
                    {
                        InventoryItemId = itemDto.InventoryItemId,
                        Quantity = itemDto.Quantity,
                        PricePerItem = itemDto.PricePerItem
                    });
                }

                _context.Sessions.Add(session);
                
                // Update Table Status if session is active
                if (session.EndTime == null)
                {
                    var table = await _context.Tables.FindAsync(session.TableId);
                    if (table != null) table.Status = Core.Domain.Enums.TableStatus.Occupied;
                    
                    await _hubContext.Clients.All.SendAsync("ReceiveTableStatusUpdate", session.TableId, "Occupied");
                    await _hubContext.Clients.All.SendAsync("OnSessionStarted", sessionDto);
                }
                else
                {
                    var table = await _context.Tables.FindAsync(session.TableId);
                    if (table != null) table.Status = Core.Domain.Enums.TableStatus.Available;

                    await _hubContext.Clients.All.SendAsync("ReceiveTableStatusUpdate", session.TableId, "Available");
                    await _hubContext.Clients.All.SendAsync("OnSessionEnded", sessionDto);
                }

                await _context.SaveChangesAsync();
                response.SyncedIds.Add(sessionDto.SyncId);
            }
            catch (Exception)
            {
                response.FailedIds.Add(sessionDto.SyncId);
            }
        }

        return Ok(response);
    }

    [HttpPost("customers")]
    public async Task<ActionResult<SyncResponseDto>> SyncCustomers([FromBody] List<CustomerSyncDto> customers)
    {
        var response = new SyncResponseDto();
        foreach (var cDto in customers)
        {
            try {
                var existing = await _context.Customers.FindAsync(cDto.Id);
                if (existing != null) {
                    existing.Name = cDto.Name;
                    existing.Email = cDto.Email;
                    existing.Phone = cDto.Phone;
                    existing.Points = cDto.Points;
                } else {
                    _context.Customers.Add(new Customer {
                        Id = cDto.Id,
                        Name = cDto.Name,
                        Email = cDto.Email,
                        Phone = cDto.Phone,
                        Points = cDto.Points,
                        CreatedAt = DateTimeOffset.FromUnixTimeMilliseconds(cDto.CreatedAt).DateTime
                    });
                }
                await _context.SaveChangesAsync();
                response.SyncedIds.Add(cDto.Id.ToString());
            } catch { response.FailedIds.Add(cDto.Id.ToString()); }
        }
        await _hubContext.Clients.All.SendAsync("OnDataChanged", "Customers");
        return Ok(response);
    }

    [HttpPost("reservations")]
    public async Task<ActionResult<SyncResponseDto>> SyncReservations([FromBody] List<ReservationSyncDto> reservations)
    {
        var response = new SyncResponseDto();
        foreach (var rDto in reservations)
        {
            try {
                var existing = await _context.Reservations.FindAsync(rDto.Id);
                if (existing != null) {
                    existing.TableId = rDto.TableId;
                    existing.CustomerId = rDto.CustomerId;
                    existing.CustomerName = rDto.CustomerName;
                    existing.StartTime = DateTimeOffset.FromUnixTimeMilliseconds(rDto.StartTime).DateTime;
                    existing.EndTime = DateTimeOffset.FromUnixTimeMilliseconds(rDto.EndTime).DateTime;
                } else {
                    _context.Reservations.Add(new Reservation {
                        Id = rDto.Id,
                        TableId = rDto.TableId,
                        CustomerId = rDto.CustomerId,
                        CustomerName = rDto.CustomerName,
                        StartTime = DateTimeOffset.FromUnixTimeMilliseconds(rDto.StartTime).DateTime,
                        EndTime = DateTimeOffset.FromUnixTimeMilliseconds(rDto.EndTime).DateTime,
                        IsSynced = true
                    });
                }
                await _context.SaveChangesAsync();
                response.SyncedIds.Add(rDto.Id.ToString());
            } catch { response.FailedIds.Add(rDto.Id.ToString()); }
        }
        await _hubContext.Clients.All.SendAsync("OnDataChanged", "Reservations");
        return Ok(response);
    }
}
