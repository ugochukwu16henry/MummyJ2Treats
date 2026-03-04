using System;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Orders;

namespace MummyJ2Treats.Domain.Riders;

public enum RiderStatus
{
    PendingApproval = 0,
    Active = 1,
    Inactive = 2
}

public class Rider : BaseEntity
{
    public string FullName { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;

    /// <summary>
    /// Optional external identity link to the user account if riders log in via the main Users table.
    /// </summary>
    public Guid? UserId { get; set; }

    public RiderStatus Status { get; set; } = RiderStatus.PendingApproval;
}

public class DeliveryAssignment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public Guid RiderId { get; set; }
    public Rider? Rider { get; set; }

    public string? CurrentLatitude { get; set; }
    public string? CurrentLongitude { get; set; }
}

