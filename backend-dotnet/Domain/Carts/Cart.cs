using System;
using System.Collections.Generic;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Products;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Domain.Carts;

public class Cart : BaseEntity
{
    public Guid CustomerId { get; set; }
    public User? Customer { get; set; }

    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}

public class CartItem : BaseEntity
{
    public Guid CartId { get; set; }
    public Cart? Cart { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

