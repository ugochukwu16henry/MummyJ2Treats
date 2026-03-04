using System.Collections.Generic;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Orders;

namespace MummyJ2Treats.Domain.Users;

public enum UserRole
{
    Admin = 1,
    Customer = 2,
    Rider = 3
}

/// <summary>
/// Single account type used for admin, customer and rider roles.
/// </summary>
public class User : BaseEntity
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

