namespace MummyJ2Treats.Application.Products;

public sealed record ProductSummaryDto(
    string Id,
    string Name,
    string Slug,
    string? Description,
    decimal Price
);

public sealed record ProductDetailDto(
    string Id,
    string Name,
    string Slug,
    string? Description,
    decimal Price,
    int Stock,
    string CategoryName
);

public sealed record CategoryListDto(
    string Id,
    string Name,
    string Slug,
    string? Description,
    int ProductCount
);

