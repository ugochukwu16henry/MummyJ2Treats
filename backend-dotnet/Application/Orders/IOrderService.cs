using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Orders;

public interface IOrderService
{
    Task<OrderSummaryDto> CreateOrderAsync(CreateOrderRequest request, Guid customerId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OrderSummaryDto>> GetMyOrdersAsync(Guid customerId, CancellationToken cancellationToken = default);
}

