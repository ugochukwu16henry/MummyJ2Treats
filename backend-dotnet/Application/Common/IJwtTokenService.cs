using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Application.Common;

public sealed record JwtTokens(string AccessToken, string RefreshToken);

public interface IJwtTokenService
{
    JwtTokens GenerateTokens(User user);
}

