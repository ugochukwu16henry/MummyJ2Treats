namespace MummyJ2Treats.Application.Auth;

public sealed record RegisterCustomerRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? Phone
);

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    string Role,
    string FirstName,
    string LastName,
    string Email
);

