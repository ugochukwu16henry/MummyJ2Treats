using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Infrastructure.Persistence;
using MummyJ2Treats.Domain.Products;

namespace MummyJ2Treats.Api.Admin;

public static class AdminProductEndpoints
{
    public static IEndpointRouteBuilder MapAdminProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/products")
            .WithTags("Admin Products")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("/", async (MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var list = await db.Products
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .Include(p => p.Category)
                .Select(p => new
                {
                    id = p.Id,
                    name = p.Name,
                    slug = p.Slug,
                    description = p.Description,
                    price = p.Price,
                    stock = (int?)p.Stock,
                    is_active = p.IsActive,
                    vendor_name = "Store",
                    vendor_slug = "store",
                    category = p.Category != null ? p.Category.Name : (string?)null,
                    category_id = p.CategoryId,
                    size_label = (string?)null,
                    ingredients = (string?)null,
                    nutritional_info = (string?)null,
                    image_url = (string?)null
                })
                .ToListAsync(ct);
            return Results.Ok(new { data = list });
        })
        .WithSummary("List all products (admin)");

        group.MapPost("/", async (CreateProductRequest request, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId && !c.IsDeleted, ct);
            if (!categoryExists)
                return Results.BadRequest(new { message = "Category not found." });

            var slug = string.IsNullOrWhiteSpace(request.Slug)
                ? Slugify(request.Name)
                : request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
            slug = await EnsureUniqueSlug(db, slug, null, ct);

            var product = new Product
            {
                Name = request.Name.Trim(),
                Slug = slug,
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                Price = request.Price,
                Stock = request.Stock,
                CategoryId = request.CategoryId,
                IsActive = request.IsActive
            };
            db.Products.Add(product);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new
            {
                id = product.Id,
                name = product.Name,
                slug = product.Slug,
                description = product.Description,
                price = product.Price,
                stock = product.Stock,
                is_active = product.IsActive,
                vendor_name = "Store",
                vendor_slug = "store",
                category = (string?)null
            });
        })
        .WithSummary("Create product (admin)");

        group.MapPatch("/{id:guid}", async (Guid id, UpdateProductRequest request, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (product == null)
                return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(request.Name))
                product.Name = request.Name.Trim();
            if (request.Slug != null)
                product.Slug = request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
            else if (!string.IsNullOrWhiteSpace(request.Name))
                product.Slug = await EnsureUniqueSlug(db, Slugify(product.Name), id, ct);
            if (request.Description != null)
                product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            if (request.Price.HasValue && request.Price.Value >= 0)
                product.Price = request.Price.Value;
            if (request.Stock.HasValue)
                product.Stock = request.Stock.Value;
            if (request.IsActive.HasValue)
                product.IsActive = request.IsActive.Value;
            if (request.CategoryId.HasValue)
            {
                var catExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId.Value && !c.IsDeleted, ct);
                if (catExists)
                    product.CategoryId = request.CategoryId.Value;
            }
            product.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new
            {
                id = product.Id,
                name = product.Name,
                slug = product.Slug,
                description = product.Description,
                price = product.Price,
                stock = product.Stock,
                is_active = product.IsActive,
                vendor_name = "Store",
                vendor_slug = "store",
                category = product.Category?.Name
            });
        })
        .WithSummary("Update product (admin)");

        group.MapDelete("/{id:guid}", async (Guid id, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
            if (product == null)
                return Results.NotFound();
            product.IsDeleted = true;
            product.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok();
        })
        .WithSummary("Delete product (admin)");

        return app;
    }

    private static string Slugify(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "product";
        var slug = name.Trim().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "product" : slug;
    }

    private static async Task<string> EnsureUniqueSlug(MummyJ2TreatsDbContext db, string slug, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = slug;
        var n = 0;
        while (true)
        {
            var query = db.Products.Where(p => p.Slug == slug && !p.IsDeleted);
            if (excludeId.HasValue)
                query = query.Where(p => p.Id != excludeId.Value);
            var exists = await query.AnyAsync(ct);
            if (!exists) return slug;
            slug = baseSlug + "-" + (++n);
        }
    }
}

public record CreateProductRequest(string Name, string? Slug, string? Description, decimal Price, int Stock, Guid CategoryId, bool IsActive = true);
public record UpdateProductRequest(string? Name, string? Slug, string? Description, decimal? Price, int? Stock, bool? IsActive, Guid? CategoryId);
