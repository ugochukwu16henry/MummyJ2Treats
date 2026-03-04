using System;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Orders;

namespace MummyJ2Treats.Domain.Payments;

public enum PaymentMethod
{
    BankTransfer = 1,
    Card = 2
}

public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2
}

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public decimal Amount { get; set; }

    /// <summary>
    /// Reference from Stripe/Paystack or internal bank transfer reference.
    /// </summary>
    public string? ProviderReference { get; set; }

    /// <summary>
    /// Path or URL to uploaded transfer receipt when using manual bank transfer.
    /// </summary>
    public string? ReceiptUrl { get; set; }
}

