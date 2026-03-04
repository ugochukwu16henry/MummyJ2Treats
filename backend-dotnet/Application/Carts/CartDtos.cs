using System.Collections.Generic;

namespace MummyJ2Treats.Application.Carts;

public sealed record CartItemDto(
    string ProductId,
    string Name,
    string VendorName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal
);

public sealed record CartResponseDto(
    string? CartId,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal
);

