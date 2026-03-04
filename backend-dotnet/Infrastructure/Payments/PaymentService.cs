using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Payments;
using MummyJ2Treats.Domain.Payments;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Payments;

public sealed class PaymentService : IPaymentService
{
    private readonly MummyJ2TreatsDbContext _db;

    public PaymentService(MummyJ2TreatsDbContext db)
    {
        _db = db;
    }

    public async Task<InitializeOnlinePaymentResponse> InitializeOnlinePaymentAsync(InitializeOnlinePaymentRequest request, CancellationToken cancellationToken = default)
    {
        var orderId = Guid.Parse(request.OrderId);
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("Order not found.");
        }

        var amount = order.Total;

        var payment = new Payment
        {
            OrderId = order.Id,
            Method = PaymentMethod.Card,
            Status = PaymentStatus.Pending,
            Amount = amount,
            ProviderReference = null
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(cancellationToken);

        // TODO: Integrate with Paystack / Stripe and generate real URL.
        var paymentUrl = $"https://payments.example.com/checkout/{payment.Id}";

        return new InitializeOnlinePaymentResponse(
            PaymentId: payment.Id.ToString(),
            Provider: request.Provider,
            PaymentUrl: paymentUrl);
    }

    public async Task<PaymentDto> CreateBankTransferPaymentAsync(BankTransferPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var orderId = Guid.Parse(request.OrderId);
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId && !o.IsDeleted, cancellationToken);
        if (order is null)
        {
            throw new InvalidOperationException("Order not found.");
        }

        var payment = new Payment
        {
            OrderId = order.Id,
            Method = PaymentMethod.BankTransfer,
            Status = PaymentStatus.Pending,
            Amount = order.Total,
            ReceiptUrl = request.ReceiptUrl
        };

        _db.Payments.Add(payment);
        await _db.SaveChangesAsync(cancellationToken);

        return new PaymentDto(
            Id: payment.Id.ToString(),
            OrderId: payment.OrderId.ToString(),
            Method: payment.Method.ToString(),
            Status: payment.Status.ToString(),
            Amount: payment.Amount,
            ProviderReference: payment.ProviderReference,
            ReceiptUrl: payment.ReceiptUrl,
            CreatedAt: payment.CreatedAt);
    }
}

