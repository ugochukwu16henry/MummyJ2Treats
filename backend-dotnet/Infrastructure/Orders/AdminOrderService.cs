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
            .OrderByDescending(o => o.CreatedAt);

        var list = await query.ToListAsync(cancellationToken);

        return list
            .Select(o =>
            {
                var idText = o.Id.ToString();
                var shortId = idText.Length > 8 ? idText.Substring(0, 8) : idText;
                return new AdminOrderListItem(
                    Id: idText,
                    OrderNumber: shortId,
                    Status: o.Status.ToString(),
                    TotalAmount: o.Total,
                    CreatedAt: o.CreatedAt);
            })
            .ToList();
    }
}

