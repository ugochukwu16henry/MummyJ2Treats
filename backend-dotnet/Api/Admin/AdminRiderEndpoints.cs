using System;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Riders;

namespace MummyJ2Treats.Api.Admin;

public static class AdminRiderEndpoints
{
    public static IEndpointRouteBuilder MapAdminRiderEndpoints(this IEndpointRouteBuilder app)
    {
        // List riders
        app.MapGet("/riders", [Authorize(Roles = "Admin")] async (IRiderService service, CancellationToken ct) =>
        {
            var riders = await service.GetAllAsync(ct);
            var payload = riders.Select(r =>
            {
                var parts = (r.FullName ?? string.Empty).Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
                var firstName = parts.Length > 0 ? parts[0] : r.FullName;
                var lastName = parts.Length > 1 ? parts[1] : string.Empty;

                return new
                {
                    id = r.Id,
                    user_id = (string?)null,
                    phone = r.PhoneNumber,
                    state = string.Empty,
                    cities = (string[]?)null,
                    transport_type = (string?)null,
                    is_available = r.IsAvailable,
                    first_name = firstName,
                    last_name = lastName
                };
            });

            return Results.Ok(new { data = payload });
        })
        .WithSummary("Get all riders for admin");

        // Delete rider
        app.MapDelete("/admin/riders/{id}", [Authorize(Roles = "Admin")] async (string id, IRiderService service, CancellationToken ct) =>
        {
            if (!Guid.TryParse(id, out var riderId))
            {
                return Results.BadRequest(new { message = "Invalid rider id." });
            }

            await service.DeleteAsync(riderId, ct);
            return Results.NoContent();
        })
        .WithSummary("Delete a rider");

        return app;
    }
}

