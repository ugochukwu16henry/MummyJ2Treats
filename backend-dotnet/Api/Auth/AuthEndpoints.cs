using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using MummyJ2Treats.Application.Auth;

namespace MummyJ2Treats.Api.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth").WithTags("Auth");

        group.MapPost("/register/customer", async (RegisterCustomerRequest request, IAuthService service, CancellationToken ct) =>
        {
            var result = await service.RegisterCustomerAsync(request, ct);
            return Results.Ok(result);
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
        })
        .WithSummary("Login with email and password");

        return app;
    }
}

