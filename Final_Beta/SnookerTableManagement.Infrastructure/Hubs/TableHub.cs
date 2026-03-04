using Microsoft.AspNetCore.SignalR;

namespace SnookerTableManagement.Infrastructure.Hubs;

public class TableHub : Hub
{
    public async Task UpdateTableStatus(Guid tableId, string status)
    {
        await Clients.All.SendAsync("ReceiveTableStatusUpdate", tableId, status);
    }

    public async Task SessionStarted(Guid sessionId, Guid tableId)
    {
        await Clients.All.SendAsync("OnSessionStarted", sessionId, tableId);
    }

    public async Task SessionEnded(Guid sessionId, Guid tableId, decimal totalAmount)
    {
        await Clients.All.SendAsync("OnSessionEnded", sessionId, tableId, totalAmount);
    }
}
