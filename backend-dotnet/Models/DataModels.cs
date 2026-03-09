using System.Text.Json.Serialization;

namespace MummyJ2Treats.Api.Models;

public class StoreData
{
    public List<Category> Categories { get; set; } = new();
    public List<Product> Products { get; set; } = new();
    public List<Order> Orders { get; set; } = new();
}

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
}

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Size { get; set; }
    public string? ImageUrl { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsActive { get; set; } = true;

    public static Product Create(CreateProductRequest request, IEnumerable<Category> categories)
    {
        if (!categories.Any(c => c.Id == request.CategoryId))
            throw new InvalidOperationException("Category not found.");

        return new Product
        {
            Name = request.Name.Trim(),
            Slug = Slugify(request.Slug ?? request.Name),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Price = request.Price,
            Size = string.IsNullOrWhiteSpace(request.Size) ? null : request.Size.Trim(),
            ImageUrl = request.ImageUrl,
            CategoryId = request.CategoryId,
            IsActive = request.IsActive
        };
    }

    public void Update(UpdateProductRequest request, IEnumerable<Category> categories)
    {
        if (!string.IsNullOrWhiteSpace(request.Name))
            Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Slug))
            Slug = Slugify(request.Slug);
        if (request.Description is not null)
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        if (request.Price.HasValue)
            Price = request.Price.Value;
        if (request.Size is not null)
            Size = string.IsNullOrWhiteSpace(request.Size) ? null : request.Size.Trim();
        if (request.ImageUrl is not null)
            ImageUrl = request.ImageUrl;
        if (request.CategoryId.HasValue)
        {
            if (!categories.Any(c => c.Id == request.CategoryId.Value))
                throw new InvalidOperationException("Category not found.");
            CategoryId = request.CategoryId.Value;
        }
        if (request.IsActive.HasValue)
            IsActive = request.IsActive.Value;
    }

    private static string Slugify(string value)
    {
        var slug = value.Trim().ToLowerInvariant();
        slug = string.Concat(slug.Where(c => char.IsLetterOrDigit(c) || char.IsWhiteSpace(c) || c == '-'));
        slug = string.Join("-", slug.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return slug;
    }
}

public class Order
{
    public Guid OrderId { get; set; } = Guid.NewGuid();
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string DeliveryAddress { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public string? BankReceiptImageUrl { get; set; }
    public string? ReceiptPdfUrl { get; set; }
    public List<OrderItem> Items { get; set; } = new();

    public static Order CreateFromRequest(CreateOrderRequest request, IEnumerable<Product> allProducts)
    {
        var order = new Order
        {
            CustomerName = request.CustomerName.Trim(),
            CustomerEmail = request.CustomerEmail.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            DeliveryAddress = request.DeliveryAddress.Trim(),
            BankReceiptImageUrl = request.BankReceiptUrl
        };

        foreach (var item in request.Items)
        {
            var product = allProducts.SingleOrDefault(p => p.Id == item.ProductId && p.IsActive);
            if (product is null)
                throw new InvalidOperationException("Product not available.");

            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity
            });
        }

        if (!order.Items.Any())
            throw new InvalidOperationException("Order must contain at least one item.");

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        return order;
    }
}

public class OrderItem
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public record CreateProductRequest(
    string Name,
    string? Slug,
    string? Description,
    decimal Price,
    string? Size,
    string? ImageUrl,
    Guid CategoryId,
    bool IsActive = true);

public record UpdateProductRequest(
    string? Name,
    string? Slug,
    string? Description,
    decimal? Price,
    string? Size,
    string? ImageUrl,
    Guid? CategoryId,
    bool? IsActive);

public record CreateOrderRequest(
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string DeliveryAddress,
    string? BankReceiptUrl,
    List<CreateOrderItemRequest> Items);

public record CreateOrderItemRequest(Guid ProductId, int Quantity);

public enum OrderStatus
{
    Pending,
    Approved,
    Rejected,
    Delivered
}


