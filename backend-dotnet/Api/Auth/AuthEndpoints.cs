using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Auth;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Api.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        group.MapGet("/me", async (ClaimsPrincipal user, MummyJ2TreatsDbContext db, CancellationToken ct) =>
        {
            var userId = GetUserId(user);
            if (userId is null)
                return Results.Json(new { message = "Unauthorized." }, statusCode: StatusCodes.Status401Unauthorized);

            var u = await db.Users
                .AsNoTracking()
                .Where(x => x.Id == userId && !x.IsDeleted && x.IsActive)
                .Select(x => new { x.Id, x.Email, x.Role, x.FirstName, x.LastName })
                .FirstOrDefaultAsync(ct);

            if (u is null)
                return Results.Json(new { message = "User not found." }, statusCode: StatusCodes.Status401Unauthorized);

            return Results.Ok(new
            {
                id = u.Id,
                email = u.Email,
                role = u.Role.ToString(),
                firstName = u.FirstName,
                lastName = u.LastName,
            });
        })
        .RequireAuthorization()
        .WithSummary("Get current user profile (role, name, email)");

        group.MapPost("/register/customer", async (RegisterCustomerRequest request, IAuthService service, CancellationToken ct) =>
        {
            try
            {
                var result = await service.RegisterCustomerAsync(request, ct);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex) when (ex.Message?.Contains("already registered") == true)
            {
                return Results.Json(new { message = ex.Message }, statusCode: StatusCodes.Status400BadRequest);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Auth] Register error: {ex}");
                return Results.Json(new { message = ex.Message ?? "Registration failed." }, statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithSummary("Register a new customer account");

        group.MapPost("/login", async (LoginRequest request, IAuthService service, CancellationToken ct) =>
        {
            try
            {
                var result = await service.LoginAsync(request, ct);
                return Results.Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Json(new { message = "Invalid email or password." }, statusCode: StatusCodes.Status401Unauthorized);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Auth] Login error: {ex}");
                return Results.Json(new { message = ex.Message ?? "Login failed." }, statusCode: StatusCodes.Status500InternalServerError);
            }
        })
        .WithSummary("Login with email and password");

        return app;
    }

    private static Guid? GetUserId(ClaimsPrincipal user)
    {
        var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("sub")?.Value;
        return Guid.TryParse(id, out var guid) ? guid : null;
    }
}

