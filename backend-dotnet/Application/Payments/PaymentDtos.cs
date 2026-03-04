using System;

namespace MummyJ2Treats.Application.Payments;

public sealed record InitializeOnlinePaymentRequest(
    string OrderId,
    string Provider // "paystack" or "stripe"
);

public sealed record InitializeOnlinePaymentResponse(
    string PaymentId,
    string Provider,
    string PaymentUrl
);

public sealed record BankTransferPaymentRequest(
    string OrderId,
    string ReceiptUrl
);

public sealed record PaymentDto(
    string Id,
    string OrderId,
    string Method,
    string Status,
    decimal Amount,
    string? ProviderReference,
    string? ReceiptUrl,
    DateTime CreatedAt
);

