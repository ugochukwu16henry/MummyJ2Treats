using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Orders;

namespace MummyJ2Treats.Api.Admin;

public static class AdminOrderEndpoints
{
    public static IEndpointRouteBuilder MapAdminOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/admin/orders")
            .WithTags("Admin Orders")
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapGet("/", async (IAdminOrderService service, CancellationToken ct) =>
        {
            var orders = await service.GetAllAsync(ct);
            // Shape to match existing admin UI expectations
            var payload = orders.Select(o => new
            {
                id = o.Id,
                order_number = o.OrderNumber,
                status = o.Status,
                total_amount = o.TotalAmount,
                created_at = o.CreatedAt
            });
            return Results.Ok(payload);
        })
        .WithSummary("Get all orders for admin dashboard");

        return app;
    }
}

