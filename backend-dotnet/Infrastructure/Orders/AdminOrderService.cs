using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Orders;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Orders;

public sealed class AdminOrderService : IAdminOrderService
{
    private readonly MummyJ2TreatsDbContext _db;

    public AdminOrderService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<AdminOrderListItem>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var query = _db.Orders
            .AsNoTracking()
            .Where(o => !o.IsDeleted)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new AdminOrderListItem(
                Id: o.Id.ToString(),
                OrderNumber: o.Id.ToString()[..8], // simple short id for now
                Status: o.Status.ToString(),
                TotalAmount: o.Total,
                CreatedAt: o.CreatedAt));

        return await query.ToListAsync(cancellationToken);
    }
}

