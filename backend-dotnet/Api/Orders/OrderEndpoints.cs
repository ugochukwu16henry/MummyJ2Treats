using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Orders;

namespace MummyJ2Treats.Api.Orders;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders")
            .WithTags("Orders")
            .RequireAuthorization();

        group.MapPost("/", async (CreateOrderRequest request, ClaimsPrincipal user, IOrderService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var result = await service.CreateOrderAsync(request, userId.Value, ct);
            return Results.Ok(result);
        })
        .WithSummary("Create a new order for the authenticated customer");

        group.MapGet("/me", async (ClaimsPrincipal user, IOrderService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var orders = await service.GetMyOrdersAsync(userId.Value, ct);
            return Results.Ok(orders);
        })
        .WithSummary("Get orders for the authenticated customer");

        group.MapGet("/me/{id:guid}", async (Guid id, ClaimsPrincipal user, IOrderService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var order = await service.GetMyOrderByIdAsync(userId.Value, id, ct);
            return order is null ? Results.NotFound() : Results.Ok(order);
        })
        .WithSummary("Get a single order by id for the authenticated customer");

        return app;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("sub")?.Value;

        return Guid.TryParse(id, out var guid) ? guid : null;
    }
}

