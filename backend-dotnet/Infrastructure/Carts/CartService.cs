using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Carts;
using MummyJ2Treats.Domain.Carts;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Carts;

public sealed class CartService : ICartService
{
    private readonly MummyJ2TreatsDbContext _db;

    public CartService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<CartResponseDto> GetMyCartAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .Where(c => c.CustomerId == customerId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (cart is null)
        {
            return new CartResponseDto(null, Array.Empty<CartItemDto>(), 0);
        }

        return Map(cart);
    }

    public async Task<CartResponseDto> AddItemAsync(Guid customerId, Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        if (quantity <= 0)
        {
            quantity = 1;
        }

        var cart = await GetOrCreateCart(customerId, cancellationToken);
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive && !p.IsDeleted, cancellationToken);
        if (product is null)
        {
            throw new InvalidOperationException("Product not found or not available.");
        }

        var existing = await _db.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId && !ci.IsDeleted, cancellationToken);

        if (existing is null)
        {
            var item = new CartItem
            {
                CartId = cart.Id,
                ProductId = product.Id,
                Quantity = quantity,
                UnitPrice = product.Price
            };
            _db.CartItems.Add(item);
        }
        else
        {
            existing.Quantity += quantity;
        }

        await _db.SaveChangesAsync(cancellationToken);

        // Reload with items
        cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstAsync(c => c.Id == cart.Id, cancellationToken);

        return Map(cart);
    }

    public async Task<CartResponseDto> UpdateItemAsync(Guid customerId, Guid productId, int quantity, CancellationToken cancellationToken = default)
    {
        var cart = await _db.Carts
            .FirstOrDefaultAsync(c => c.CustomerId == customerId && !c.IsDeleted, cancellationToken);

        if (cart is null)
        {
            return new CartResponseDto(null, Array.Empty<CartItemDto>(), 0);
        }

        var item = await _db.CartItems
            .FirstOrDefaultAsync(ci => ci.CartId == cart.Id && ci.ProductId == productId && !ci.IsDeleted, cancellationToken);

        if (item is null)
        {
            // Nothing to update; just return current cart
            cart = await _db.Carts
                .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                .FirstAsync(c => c.Id == cart.Id, cancellationToken);
            return Map(cart);
        }

        if (quantity <= 0)
        {
            _db.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = quantity;
        }

        await _db.SaveChangesAsync(cancellationToken);

        cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstAsync(c => c.Id == cart.Id, cancellationToken);

        return Map(cart);
    }

    private async Task<Cart> GetOrCreateCart(Guid customerId, CancellationToken cancellationToken)
    {
        var cart = await _db.Carts
            .FirstOrDefaultAsync(c => c.CustomerId == customerId && !c.IsDeleted, cancellationToken);

        if (cart is not null)
        {
            return cart;
        }

        cart = new Cart
        {
            CustomerId = customerId
        };
        _db.Carts.Add(cart);
        await _db.SaveChangesAsync(cancellationToken);
        return cart;
    }

    private static CartResponseDto Map(Cart cart)
    {
        var items = cart.Items
            .Where(i => !i.IsDeleted)
            .Select(i =>
            {
                var lineTotal = i.UnitPrice * i.Quantity;
                var name = i.Product?.Name ?? "Product";
                const string vendorName = "MummyJ2Treats";
                return new CartItemDto(
                    ProductId: i.ProductId.ToString(),
                    Name: name,
                    VendorName: vendorName,
                    Quantity: i.Quantity,
                    UnitPrice: i.UnitPrice,
                    LineTotal: lineTotal);
            })
            .ToList();

        var subtotal = items.Sum(i => i.LineTotal);
        return new CartResponseDto(cart.Id.ToString(), items, subtotal);
    }
}

