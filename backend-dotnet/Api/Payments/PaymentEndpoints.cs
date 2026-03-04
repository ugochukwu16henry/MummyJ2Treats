using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Payments;

namespace MummyJ2Treats.Api.Payments;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/payments")
            .WithTags("Payments");

        // Online payments (Stripe / Paystack) - stub for now.
        group.MapPost("/initialize", async (InitializeOnlinePaymentRequest request, IPaymentService service, CancellationToken ct) =>
        {
            var response = await service.InitializeOnlinePaymentAsync(request, ct);
            return Results.Ok(response);
        })
        .WithSummary("Initialize an online payment and get a payment URL");

        // Bank transfer with uploaded receipt (URL/path provided by frontend).
        group.MapPost("/bank-transfer", [Authorize] async (BankTransferPaymentRequest request, IPaymentService service, CancellationToken ct) =>
        {
            var payment = await service.CreateBankTransferPaymentAsync(request, ct);
            return Results.Ok(payment);
        })
        .WithSummary("Record a bank transfer payment with receipt");

        // Webhook placeholders for providers (to be completed when providers are wired).
        group.MapPost("/webhook/{provider}", (string provider) =>
        {
            // TODO: Implement real webhook signature validation & status updates.
            return Results.Ok();
        })
        .WithSummary("Webhook endpoint for payment providers");

        return app;
    }
}

