using System;

namespace MummyJ2Treats.Application.Orders;

public sealed record AdminOrderListItem(
    string Id,
    string OrderNumber,
    string Status,
    decimal TotalAmount,
    DateTime CreatedAt
);

