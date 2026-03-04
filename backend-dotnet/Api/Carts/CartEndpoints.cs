using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Carts;

namespace MummyJ2Treats.Api.Carts;

public static class CartEndpoints
{
    private sealed record AddItemRequest(string ProductId, int? Quantity);
    private sealed record UpdateQuantityRequest(int Quantity);

    public static IEndpointRouteBuilder MapCartEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/cart")
            .WithTags("Cart")
            .RequireAuthorization();

        group.MapGet("/me", async (ClaimsPrincipal user, ICartService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            var cart = await service.GetMyCartAsync(userId.Value, ct);
            var response = new
            {
                cart = cart.CartId is null ? null : new { id = cart.CartId },
                items = cart.Items,
                subtotal = cart.Subtotal
            };
            return Results.Ok(response);
        })
        .WithSummary("Get current customer's cart");

        group.MapPost("/items", async (AddItemRequest request, ClaimsPrincipal user, ICartService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            if (!Guid.TryParse(request.ProductId, out var productId))
            {
                return Results.BadRequest(new { message = "Invalid productId." });
            }

            var qty = request.Quantity ?? 1;
            var cart = await service.AddItemAsync(userId.Value, productId, qty, ct);
            var response = new
            {
                cart = cart.CartId is null ? null : new { id = cart.CartId },
                items = cart.Items,
                subtotal = cart.Subtotal
            };
            return Results.Ok(response);
        })
        .WithSummary("Add an item to the cart or increase its quantity");

        group.MapPatch("/items/{productId}", async (string productId, UpdateQuantityRequest request, ClaimsPrincipal user, ICartService service, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
            {
                return Results.Unauthorized();
            }

            if (!Guid.TryParse(productId, out var pid))
            {
                return Results.BadRequest(new { message = "Invalid productId." });
            }

            var cart = await service.UpdateItemAsync(userId.Value, pid, request.Quantity, ct);
            var response = new
            {
                cart = cart.CartId is null ? null : new { id = cart.CartId },
                items = cart.Items,
                subtotal = cart.Subtotal
            };
            return Results.Ok(response);
        })
        .WithSummary("Update the quantity of a cart item (0 removes it)");

        return app;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("sub")?.Value;

        return Guid.TryParse(id, out var guid) ? guid : null;
    }
}

