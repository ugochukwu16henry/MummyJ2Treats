using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Products;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Products;

public sealed class ProductQueryService : IProductQueryService
{
    private readonly MummyJ2TreatsDbContext _db;

    public ProductQueryService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Products
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderBy(p => p.CreatedAt)
            .Take(12)
            .Select(p => new ProductSummaryDto(
                p.Id.ToString(),
                p.Name,
                p.Slug,
                p.Description,
                p.Price))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> GetByCategorySlugAsync(string categorySlug, CancellationToken cancellationToken = default)
    {
        return await _db.Products
            .Where(p => p.IsActive && !p.IsDeleted && p.Category != null && p.Category.Slug == categorySlug)
            .OrderBy(p => p.Name)
            .Select(p => new ProductSummaryDto(
                p.Id.ToString(),
                p.Name,
                p.Slug,
                p.Description,
                p.Price))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _db.Products
            .Where(p => p.Slug == slug && p.IsActive && !p.IsDeleted)
            .Select(p => new ProductDetailDto(
                p.Id.ToString(),
                p.Name,
                p.Slug,
                p.Description,
                p.Price,
                p.Stock,
                p.Category != null ? p.Category.Name : string.Empty))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CategoryListDto>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryListDto(
                c.Id.ToString(),
                c.Name,
                c.Slug,
                c.Description,
                c.Products.Count(p => p.IsActive && !p.IsDeleted)))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ProductSummaryDto>> SearchAsync(string query, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return Array.Empty<ProductSummaryDto>();

        var term = query.Trim().ToLower();
        return await _db.Products
            .Where(p => p.IsActive && !p.IsDeleted && (p.Name.ToLower().Contains(term) || (p.Description != null && p.Description.ToLower().Contains(term))))
            .OrderBy(p => p.Name)
            .Take(20)
            .Select(p => new ProductSummaryDto(
                p.Id.ToString(),
                p.Name,
                p.Slug,
                p.Description,
                p.Price))
            .ToListAsync(cancellationToken);
    }
}

