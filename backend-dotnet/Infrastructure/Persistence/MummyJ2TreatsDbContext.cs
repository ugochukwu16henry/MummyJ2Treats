using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Domain.Blog;
using MummyJ2Treats.Domain.Carts;
using MummyJ2Treats.Domain.Locations;
using MummyJ2Treats.Domain.Orders;
using MummyJ2Treats.Domain.Payments;
using MummyJ2Treats.Domain.Products;
using MummyJ2Treats.Domain.Riders;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Infrastructure.Persistence;

public class MummyJ2TreatsDbContext : DbContext
{
    public MummyJ2TreatsDbContext(DbContextOptions<MummyJ2TreatsDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Rider> Riders => Set<Rider>();
    public DbSet<DeliveryAssignment> DeliveryAssignments => Set<DeliveryAssignment>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();
    public DbSet<BlogMedia> BlogMedia => Set<BlogMedia>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Product>()
            .HasIndex(p => p.Slug)
            .IsUnique();

        modelBuilder.Entity<Category>()
            .HasIndex(c => c.Slug)
            .IsUnique();

        modelBuilder.Entity<BlogPost>()
            .HasIndex(b => b.Slug)
            .IsUnique();

        modelBuilder.Entity<Cart>()
            .HasIndex(c => c.CustomerId);

        modelBuilder.Entity<CartItem>()
            .HasIndex(ci => new { ci.CartId, ci.ProductId })
            .IsUnique();
    }
}

