using System;
using System.Collections.Generic;

namespace MummyJ2Treats.Application.Orders;

public sealed record OrderItemRequest(
    string ProductId,
    int Quantity
);

public sealed record CreateOrderRequest(
    IReadOnlyList<OrderItemRequest> Items,
    string AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? Country,
    string? PostalCode,
    double Latitude,
    double Longitude,
    decimal DeliveryFee
);

public sealed record OrderItemDto(
    string ProductName,
    int Quantity,
    decimal UnitPrice
);

public sealed record OrderSummaryDto(
    string Id,
    DateTime CreatedAt,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    string Status,
    IReadOnlyList<OrderItemDto> Items
);

public sealed record OrderDetailDto(
    string Id,
    DateTime CreatedAt,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    string Status,
    string? DeliveryAddress,
    IReadOnlyList<OrderItemDto> Items
);

