using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Orders;
using MummyJ2Treats.Domain.Locations;
using MummyJ2Treats.Domain.Orders;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Orders;

public sealed class OrderService : IOrderService
{
    private readonly MummyJ2TreatsDbContext _db;

    public OrderService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<OrderSummaryDto> CreateOrderAsync(CreateOrderRequest request, Guid customerId, CancellationToken cancellationToken = default)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new InvalidOperationException("Order must contain at least one item.");
        }

        var productIds = request.Items.Select(i => Guid.Parse(i.ProductId)).ToList();
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive && !p.IsDeleted)
            .ToListAsync(cancellationToken);

        if (products.Count != productIds.Count)
        {
            throw new InvalidOperationException("One or more products are not available.");
        }

        var location = new Location
        {
            UserId = customerId,
            AddressLine1 = request.AddressLine1,
            AddressLine2 = request.AddressLine2,
            City = request.City,
            State = request.State,
            Country = request.Country,
            PostalCode = request.PostalCode,
            Latitude = request.Latitude,
            Longitude = request.Longitude
        };

        var order = new Order
        {
            CustomerId = customerId,
            DeliveryLocation = location,
            Status = OrderStatus.Processing
        };

        decimal subtotal = 0;
        foreach (var item in request.Items)
        {
            var pid = Guid.Parse(item.ProductId);
            var product = products.First(p => p.Id == pid);
            var lineSubtotal = product.Price * item.Quantity;
            subtotal += lineSubtotal;

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });
        }

        order.Subtotal = subtotal;
        order.DeliveryFee = request.DeliveryFee;

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(cancellationToken);

        return MapToSummary(order);
    }

    public async Task<IReadOnlyList<OrderSummaryDto>> GetMyOrdersAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId && !o.IsDeleted)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(MapToSummary).ToList();
    }

    private static OrderSummaryDto MapToSummary(Order order)
    {
        var items = order.Items
            .Select(i => new OrderItemDto(
                ProductName: string.Empty, // can be populated with join later
                Quantity: i.Quantity,
                UnitPrice: i.UnitPrice))
            .ToList();

        return new OrderSummaryDto(
            Id: order.Id.ToString(),
            CreatedAt: order.CreatedAt,
            Subtotal: order.Subtotal,
            DeliveryFee: order.DeliveryFee,
            Total: order.Total,
            Status: order.Status.ToString(),
            Items: items);
    }
}

