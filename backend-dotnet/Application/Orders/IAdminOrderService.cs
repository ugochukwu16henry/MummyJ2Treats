using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Orders;

public interface IAdminOrderService
{
    Task<IReadOnlyList<AdminOrderListItem>> GetAllAsync(CancellationToken cancellationToken = default);
}

