using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace MummyJ2Treats.Application.Products;

public interface IProductQueryService
{
    Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetByCategorySlugAsync(string categorySlug, CancellationToken cancellationToken = default);

    Task<ProductDetailDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
}

