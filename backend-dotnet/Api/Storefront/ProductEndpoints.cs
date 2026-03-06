using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Products;

namespace MummyJ2Treats.Api.Storefront;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/products").WithTags("Products");

        group.MapGet("/categories", async (IProductQueryService service, CancellationToken ct) =>
        {
            var categories = await service.GetCategoriesAsync(ct);
            return Results.Ok(categories);
        })
        .WithSummary("Get all categories with product counts");

        group.MapGet("/featured", async (IProductQueryService service, CancellationToken ct) =>
        {
            var products = await service.GetFeaturedAsync(ct);
            return Results.Ok(products);
        })
        .WithSummary("Get featured products for homepage");

        group.MapGet("/search", async (string? q, IProductQueryService service, CancellationToken ct) =>
        {
            var query = q ?? string.Empty;
            var products = await service.SearchAsync(query, ct);
            return Results.Ok(products);
        })
        .WithSummary("Search products by name or description");

        group.MapGet("/by-category/{slug}", async (string slug, IProductQueryService service, CancellationToken ct) =>
        {
            var products = await service.GetByCategorySlugAsync(slug, ct);
            return Results.Ok(products);
        })
        .WithSummary("Get products by category slug");

        group.MapGet("/{slug}", async (string slug, IProductQueryService service, CancellationToken ct) =>
        {
            var product = await service.GetBySlugAsync(slug, ct);
            return product is null ? Results.NotFound() : Results.Ok(product);
        })
        .WithSummary("Get product details by slug");

        return app;
    }
}

