using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using MummyJ2Treats.Application.Auth;
using MummyJ2Treats.Application.Common;
using MummyJ2Treats.Domain.Users;
using MummyJ2Treats.Infrastructure.Persistence;

namespace MummyJ2Treats.Infrastructure.Auth;

public sealed class AuthService : IAuthService
{
    private readonly MummyJ2TreatsDbContext _db;
    private readonly IJwtTokenService _jwt;

    public AuthService(MummyJ2TreatsDbContext db, IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<AuthResponse> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Customer,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        var tokens = _jwt.GenerateTokens(user);
        return new AuthResponse(tokens.AccessToken, tokens.RefreshToken, user.Role.ToString(), user.FirstName, user.LastName, user.Email);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .Where(u => u.Email == request.Email && !u.IsDeleted && u.IsActive)
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        var tokens = _jwt.GenerateTokens(user);
        return new AuthResponse(tokens.AccessToken, tokens.RefreshToken, user.Role.ToString(), user.FirstName, user.LastName, user.Email);
    }
}

