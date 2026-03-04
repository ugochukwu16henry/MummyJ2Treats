using System;
using System.Collections.Generic;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Products;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Domain.Orders;

public enum OrderStatus
{
    Pending = 0,
    Processing = 1,
    OutForDelivery = 2,
    Delivered = 3,
    Cancelled = 4
}

public class Order : BaseEntity
{
    public Guid CustomerId { get; set; }
    public User? Customer { get; set; }

    public decimal Subtotal { get; set; }
    public decimal DeliveryFee { get; set; }

    public decimal Total => Subtotal + DeliveryFee;

    public OrderStatus Status { get; set; } = OrderStatus.Processing;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

