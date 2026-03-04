using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MummyJ2Treats.Application.Common;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Infrastructure.Auth;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public JwtTokens GenerateTokens(User user)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
        var issuer = jwtSection["Issuer"] ?? "MummyJ2Treats";
        var audience = jwtSection["Audience"] ?? "MummyJ2Treats.Frontend";
        var accessMinutes = int.TryParse(jwtSection["AccessTokenMinutes"], out var m) ? m : 60;
        var refreshDays = int.TryParse(jwtSection["RefreshTokenDays"], out var d) ? d : 7;

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var accessToken = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(accessMinutes),
            signingCredentials: creds);

        var refreshToken = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddDays(refreshDays),
            signingCredentials: creds);

        var handler = new JwtSecurityTokenHandler();
        return new JwtTokens(handler.WriteToken(accessToken), handler.WriteToken(refreshToken));
    }
}

