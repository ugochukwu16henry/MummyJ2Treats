using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Infrastructure.Persistence;
using MummyJ2Treats.Domain.Products;

namespace MummyJ2Treats.Api.Admin;

public static class AdminCategoryEndpoints
{
    public static IEndpointRouteBuilder MapAdminCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/founder-categories")
            .WithTags("Admin Categories")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("/", async (MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var list = await db.Categories
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    id = c.Id,
                    name = c.Name,
                    slug = c.Slug,
                    description = c.Description,
                    image_url = (string?)null,
                    sort_order = 0
                })
                .ToListAsync(ct);
            return Results.Ok(new { data = list });
        })
        .WithSummary("List all categories (admin)");

        group.MapPost("/", async (CreateCategoryRequest request, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var slug = string.IsNullOrWhiteSpace(request.Slug)
                ? Slugify(request.Name)
                : request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
            slug = await EnsureUniqueSlug(db, slug, null, ct);

            var category = new Category
            {
                Name = request.Name.Trim(),
                Slug = slug,
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim()
            };
            db.Categories.Add(category);
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { id = category.Id, name = category.Name, slug = category.Slug, description = category.Description });
        })
        .WithSummary("Create category (admin)");

        group.MapPatch("/{id:guid}", async (Guid id, UpdateCategoryRequest request, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (category == null)
                return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(request.Name))
                category.Name = request.Name.Trim();
            if (request.Slug != null)
                category.Slug = request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");
            else if (!string.IsNullOrWhiteSpace(request.Name))
                category.Slug = await EnsureUniqueSlug(db, Slugify(category.Name), id, ct);
            if (request.Description != null)
                category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            category.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { id = category.Id, name = category.Name, slug = category.Slug, description = category.Description });
        })
        .WithSummary("Update category (admin)");

        group.MapDelete("/{id:guid}", async (Guid id, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, ct);
            if (category == null)
                return Results.NotFound();
            category.IsDeleted = true;
            category.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok();
        })
        .WithSummary("Delete category (admin)");

        return app;
    }

    private static string Slugify(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "category";
        var slug = name.Trim().ToLowerInvariant();
        slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "category" : slug;
    }

    private static async Task<string> EnsureUniqueSlug(MummyJ2TreatsDbContext db, string slug, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = slug;
        var n = 0;
        while (true)
        {
            var query = db.Categories.Where(c => c.Slug == slug && !c.IsDeleted);
            if (excludeId.HasValue)
                query = query.Where(c => c.Id != excludeId.Value);
            var exists = await query.AnyAsync(ct);
            if (!exists) return slug;
            slug = baseSlug + "-" + (++n);
        }
    }
}

public record CreateCategoryRequest(string Name, string? Slug, string? Description);
public record UpdateCategoryRequest(string? Name, string? Slug, string? Description);
